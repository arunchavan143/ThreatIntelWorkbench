'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ai_chats', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      conversation_id: { type: Sequelize.STRING, allowNull: false },
      messages: { type: Sequelize.JSONB, allowNull: false },
      summary: { type: Sequelize.TEXT, allowNull: true },
      timestamp: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });
    await queryInterface.addIndex('ai_chats', ['conversation_id']);
  },
  down: async (queryInterface) => { await queryInterface.dropTable('ai_chats'); }
};