'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Investigation extends Model {
    static associate() {
      // define association here if needed
    }
  }
  Investigation.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    investigation_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    indicator: {
      type: DataTypes.STRING,
      allowNull: false
    },
    indicator_type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    provider_count: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    risk_score: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    confidence: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    verdict: {
      type: DataTypes.STRING,
      allowNull: true
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Investigation',
    tableName: 'investigations',
    timestamps: true,
  });
  return Investigation;
};
