const { RuleConfig } = require('../models');

/**
 * 读取判定规则配置为 { cfgKey: cfgValue } 映射
 * 供打卡提交 / AI 预判等运行时实时读取（管理端改完即生效）
 */
async function getRuleConfigs() {
  const configs = await RuleConfig.findAll({ order: [['id', 'ASC']] });
  const map = {};
  configs.forEach((c) => { map[c.cfgKey] = c.cfgValue; });
  return map;
}

module.exports = { getRuleConfigs };
