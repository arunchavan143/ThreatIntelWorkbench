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
    ioc: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    risk_score: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    verdict: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sources: {
      type: DataTypes.INTEGER,
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
