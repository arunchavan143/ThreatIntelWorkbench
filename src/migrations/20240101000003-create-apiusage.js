'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('api_usage', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      provider: { type: Sequelize.STRING, allowNull: false },
      daily_requests: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      remaining_quota: { type: Sequelize.INTEGER, allowNull: true },
      last_request: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });
    await queryInterface.addIndex('api_usage', ['provider']);
  },
  down: async (queryInterface) => { await queryInterface.dropTable('api_usage'); }
};