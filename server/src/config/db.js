const { Sequelize } = require('sequelize');
const env = require('./env');

const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: 'mysql',
  logging: false,
  timezone: '+08:00',
  define: {
    freezeTableName: true,
    underscored: false,
  },
  pool: { max: 10, min: 0, idle: 10000 },
});

module.exports = sequelize;
