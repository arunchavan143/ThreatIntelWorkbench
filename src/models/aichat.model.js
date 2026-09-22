'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AiChat extends Model {}
  AiChat.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    conversation_id: { type: DataTypes.STRING, allowNull: false },
    messages: { type: DataTypes.JSONB, allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: true },
    timestamp: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  }, { sequelize, modelName: 'AiChat', tableName: 'ai_chats', timestamps: true });
  return AiChat;
};