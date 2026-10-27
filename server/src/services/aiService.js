const fs = require('fs');
const sharp = require('sharp');
const env = require('../config/env');

/**
 * 餐盘剩余量 AI 预判服务
 *
 * 三级策略（按优先级）：
 *   ① EasyDL 自训练「干净/需要审核/不干净」三分类模型（配置 BAIDU_MODEL_ID 后启用，最准）
 *   ② 百度「通用物体和场景识别」advanced_general（次级方案）
 *   ③ 本地图像启发式算法（无外部依赖的兜底）
 *
 * 返回结构统一为 { score, label, features }：
 *   - score：0~1，判定置信度
 *   - label：'pass'(干净,通过) | 'review'(需要审核) | 'dirty'(不干净,未通过)
 *
 * @param {string} imagePath 图片绝对路径
 * @param {number} [threshold] 判定阈值
 * @returns {Promise<{score:number,label:string,features:object}>}
 */
async function analyzePlate(imagePath, threshold) {
  const t = threshold === undefined ? env.ai.threshold : threshold;
  const baidu = env.ai.baidu || {};
  if (baidu.apiKey && baidu.secretKey) {
    // ① EasyDL 自训练模型（空盘/剩菜二分类，最准）
    if (baidu.modelId) {
      try {
        const results = await baiduEasyDlClassify(imagePath);
        if (results.length > 0) return mapEasyDlResult(results, t);
      } catch (e) {
        console.error('[AI] EasyDL 识别失败，尝试通用物体识别:', e.message);
      }
    }
    // ② 通用物体和场景识别
    try {
      const items = await baiduGeneralClassify(imagePath);
      if (items && items.length > 0) {
        return mapKeywordsToResult(items, t);
      }
    } catch (e) {
      console.error('[AI] 百度识别失败，回退本地启发式:', e.message);
    }
  }
  // ③ 本地启发式算法
  return heuristicAnalyze(imagePath, t);
}

// ---------- 百度通用物体和场景识别 ----------

// 接口地址：https://cloud.baidu.com/doc/IMAGERECOGNITION/s/Xk3bcxe21
const BAIDU_GENERAL_URL = 'https://aip.baidubce.com/rest/2.0/image-classify/v2/advanced_general';

// access_token 缓存（有效期 30 天，提前 10 分钟刷新）
let cachedToken = { value: '', expireAt: 0 };

async function getBaiduToken() {
  const { apiKey, secretKey } = env.ai.baidu;
  if (cachedToken.value && Date.now() < cachedToken.expireAt) return cachedToken.value;

  const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`;
  const res = await fetch(url, { method: 'POST' });
  const body = await res.json();
  if (!body.access_token) {
    throw new Error('获取百度 access_token 失败: ' + (body.error_description || JSON.stringify(body)));
  }
  cachedToken = {
    value: body.access_token,
    expireAt: Date.now() + ((body.expires_in || 2592000) - 600) * 1000,
  };
  return cachedToken.value;
}

// 原图 base64 不超百度最严限制（EasyDL 编码后 ≤4M）时直接发原图，避免重压缩损失识别细节；
// 超大图才缩到 2048px 内。
const RAW_MAX_BYTES = 3 * 1024 * 1024; // 3MB 原图 ≈ 4MB base64，兼容 EasyDL 的 4M 上限

async function imageToBase64(imagePath) {
  const raw = fs.readFileSync(imagePath);
  if (raw.length <= RAW_MAX_BYTES) return raw.toString('base64');
  const buffer = await sharp(imagePath)
    .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 90 })
    .toBuffer();
  return buffer.toString('base64');
}

async function baiduGeneralClassify(imagePath) {
  const token = await getBaiduToken();
  const image = await imageToBase64(imagePath);

  const res = await fetch(`${BAIDU_GENERAL_URL}?access_token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ image }),
  });
  const body = await res.json();
  if (body.error_code) {
    throw new Error(`百度识别失败 [${body.error_code}] ${body.error_msg}`);
  }
  return body.result || [];
}

// 空盘/剩菜推断（基于百度返回的 root 上层分类）：
//   - root 含「食物」→ 存在清晰可辨的食物 → 记为该图的食物证据
//   - 实测（项目样例图）：菜品图 top 食物置信度 71%~82%，
//     空盘/剩菜盘 top 食物置信度 0%~20%，区分度良好。
//   - 空盘概率取 1 - foodScore：食物证据越强越不可能为空盘。
const FOOD_ROOT_MARKER = '食物';

function mapKeywordsToResult(items, threshold) {
  let foodScore = 0;
  const keywords = [];

  for (const it of items) {
    const kw = it.keyword || '';
    const root = it.root || '';
    const s = Number(it.score) || 0;
    keywords.push(`${kw}[${root}](${(s * 100).toFixed(1)}%)`);
    if (root.includes(FOOD_ROOT_MARKER)) foodScore = Math.max(foodScore, s);
  }

  const score = Math.max(0, Math.min(1, 1 - foodScore));
  const label = score >= threshold ? 'pass' : 'dirty';

  return {
    score: parseFloat(score.toFixed(3)),
    label,
    features: {
      foodScore: parseFloat(foodScore.toFixed(3)),
      keywords,
    },
  };
}

// ---------- 百度 EasyDL 自训练模型 ----------
// 接口地址：https://aip.baidubce.com/rpc/2.0/ai_custom/v1/classification/{modelId}
const BAIDU_EASYDL_URL = 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/classification';

async function baiduEasyDlClassify(imagePath) {
  const token = await getBaiduToken();
  const image = await imageToBase64(imagePath); // EasyDL 限制 base64 ≤4M

  const res = await fetch(`${BAIDU_EASYDL_URL}/${env.ai.baidu.modelId}?access_token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image, top_num: 3 }),
  });
  const body = await res.json();
  if (body.error_code) {
    throw new Error(`EasyDL 识别失败 [${body.error_code}] ${body.error_msg}`);
  }
  let results = body.results || body.result || [];
  if (!Array.isArray(results)) results = [results];
  return results;
}

// EasyDL 三分类模型类名 → 结果标签映射（类名需与 EasyDL 训练时的标签一致）
const EASYDL_CLASS_MAP = {
  不干净: 'dirty',
  需要审核: 'review',
  干净: 'pass',
};

function mapEasyDlResult(results, threshold) {
  const t = threshold === undefined ? env.ai.threshold : threshold;
  let top = null;
  const keywords = [];

  for (const r of results) {
    const name = r.name || '';
    const s = Number(r.score) || 0;
    keywords.push(`${name}(${(s * 100).toFixed(1)}%)`);
    if (!top || s > top.score) top = { name, score: s };
  }

  if (!top) {
    return { score: 0.5, label: 'review', features: { keywords } };
  }

  // 置信度不足或类名未识别时，归为「需要审核」
  const label = top.score >= t ? EASYDL_CLASS_MAP[top.name] || 'review' : 'review';
  return {
    score: parseFloat(Math.max(0, Math.min(1, top.score)).toFixed(3)),
    label,
    features: { keywords },
  };
}

// ---------- 本地启发式回退算法（原实现） ----------
// 基于亮度 + 白色占比 + 纹理复杂度，不依赖任何外部接口
async function heuristicAnalyze(imagePath, threshold) {
  const { data, info } = await sharp(imagePath)
    .resize(100, 100, { fit: 'cover' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels || 3;
  const pixels = info.width * info.height;

  let totalLum = 0;
  let whiteCount = 0;
  const lum = new Array(pixels);

  for (let i = 0, p = 0; i < data.length; i += channels, p++) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const l = 0.299 * r + 0.587 * g + 0.114 * b; // 感知亮度
    totalLum += l;
    lum[p] = l;
    if (r > 200 && g > 200 && b > 200) whiteCount++;
  }

  const avgLum = totalLum / pixels;
  const whiteRatio = whiteCount / pixels;

  let variance = 0;
  for (const l of lum) variance += (l - avgLum) ** 2;
  variance /= pixels;
  const std = Math.sqrt(variance);

  const lumScore = avgLum / 255;
  const texturePenalty = Math.min(std / 60, 1);
  let score = lumScore * 0.5 + whiteRatio * 0.3 + (1 - texturePenalty) * 0.2;
  score = Math.max(0, Math.min(1, score));

  const label = score >= threshold ? 'pass' : 'dirty';

  return {
    score: parseFloat(score.toFixed(3)),
    label,
    features: {
      avgLuminance: parseFloat(avgLum.toFixed(1)),
      whiteRatio: parseFloat(whiteRatio.toFixed(3)),
      luminanceStd: parseFloat(std.toFixed(1)),
    },
  };
}

module.exports = { analyzePlate };
