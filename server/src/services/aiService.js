const sharp = require('sharp');
const env = require('../config/env');

/**
 * 餐盘剩余量 AI 预判服务
 * 当前实现：基于图像颜色直方图 + 亮度特征 + 纹理复杂度的启发式预判
 *   - 光盘(空盘)：整体亮度高、白色占比高、纹理简单
 *   - 剩菜：颜色丰富、暗色区域多、纹理复杂
 * 说明：该预判结果仅作参考，最终以管理员人工审核为准（manual_with_ai 模式）。
 * 扩展点：可将 analyzePlate 内部替换为百度智能云 / 腾讯云图像识别 API 调用，
 *        只需保持返回结构 { score, label, features } 不变即可。
 *
 * @param {string} imagePath 图片绝对路径
 * @returns {Promise<{score:number,label:'empty'|'not_empty',features:object}>}
 */
async function analyzePlate(imagePath) {
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

  // 亮度标准差：近似衡量纹理/颜色复杂度（剩菜照片纹理更复杂、std 更高）
  let variance = 0;
  for (const l of lum) variance += (l - avgLum) ** 2;
  variance /= pixels;
  const std = Math.sqrt(variance);

  // 综合评分：亮度 + 白色占比 + 纹理简单度
  const lumScore = avgLum / 255;
  const texturePenalty = Math.min(std / 60, 1); // 纹理越复杂扣分越多
  let score = lumScore * 0.5 + whiteRatio * 0.3 + (1 - texturePenalty) * 0.2;
  score = Math.max(0, Math.min(1, score));

  const label = score >= env.ai.threshold ? 'empty' : 'not_empty';

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
