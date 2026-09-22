'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ApiUsage extends Model {}
  ApiUsage.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    provider: { type: DataTypes.STRING, allowNull: false },
    daily_requests: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    remaining_quota: { type: DataTypes.INTEGER, allowNull: true },
    last_request: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  }, { sequelize, modelName: 'ApiUsage', tableName: 'api_usage', timestamps: true });
  return ApiUsage;
};