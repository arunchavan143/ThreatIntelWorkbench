'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Setting extends Model {}
  Setting.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    key: { type: DataTypes.STRING, allowNull: false, unique: true },
    value: { type: DataTypes.JSONB, allowNull: false }
  }, { sequelize, modelName: 'Setting', tableName: 'settings', timestamps: true });
  return Setting;
};