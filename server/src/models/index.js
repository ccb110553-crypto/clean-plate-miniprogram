const sequelize = require('../config/db');
const User = require('./user');
const Checkin = require('./checkin');
const PointsLog = require('./pointsLog');
const Product = require('./product');
const Order = require('./order');
const Challenge = require('./challenge');
const ChallengeParticipant = require('./challengeParticipant');
const Menu = require('./menu');
const Recipe = require('./recipe');
const RuleConfig = require('./ruleConfig');
const MisjudgeSample = require('./misjudgeSample');

// ---- 关联关系 ----
User.hasMany(Checkin, { foreignKey: 'user_id', as: 'checkins' });
Checkin.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(PointsLog, { foreignKey: 'user_id', as: 'pointsLogs' });
PointsLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Product.hasMany(Order, { foreignKey: 'product_id', as: 'orders' });
Order.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Challenge.hasMany(ChallengeParticipant, { foreignKey: 'challenge_id', as: 'participants' });
ChallengeParticipant.belongsTo(Challenge, { foreignKey: 'challenge_id', as: 'challenge' });

User.hasMany(ChallengeParticipant, { foreignKey: 'user_id', as: 'challengeParticipants' });
ChallengeParticipant.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Menu.hasMany(Checkin, { foreignKey: 'menu_id', as: 'checkins' });
Checkin.belongsTo(Menu, { foreignKey: 'menu_id', as: 'menu' });

module.exports = {
  sequelize,
  User,
  Checkin,
  PointsLog,
  Product,
  Order,
  Challenge,
  ChallengeParticipant,
  Menu,
  Recipe,
  RuleConfig,
  MisjudgeSample,
};
