'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('investigations', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      investigation_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      indicator: {
        type: Sequelize.STRING,
        allowNull: false
      },
      indicator_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      provider_count: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      risk_score: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      confidence: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      verdict: {
        type: Sequelize.STRING,
        allowNull: true
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.addIndex('investigations', ['indicator']);
    await queryInterface.addIndex('investigations', ['timestamp']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('investigations');
  }
};
