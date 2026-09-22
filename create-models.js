const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'src', 'models');
const migrationsDir = path.join(__dirname, 'src', 'migrations');

const models = {
    'aichat.model.js': `'use strict';
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
};`,
    
    'report.model.js': `'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Report extends Model {}
  Report.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    investigation_id: { type: DataTypes.STRING, allowNull: false },
    filename: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false },
    generated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  }, { sequelize, modelName: 'Report', tableName: 'reports', timestamps: true });
  return Report;
};`,
    
    'apiusage.model.js': `'use strict';
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
};`,

    'setting.model.js': `'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Setting extends Model {}
  Setting.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    key: { type: DataTypes.STRING, allowNull: false, unique: true },
    value: { type: DataTypes.JSONB, allowNull: false }
  }, { sequelize, modelName: 'Setting', tableName: 'settings', timestamps: true });
  return Setting;
};`,

    'auditlog.model.js': `'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AuditLog extends Model {}
  AuditLog.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    event_type: { type: DataTypes.STRING, allowNull: false },
    details: { type: DataTypes.JSONB, allowNull: true },
    timestamp: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  }, { sequelize, modelName: 'AuditLog', tableName: 'audit_logs', timestamps: true });
  return AuditLog;
};`
};

const migrations = {
    '20240101000001-create-aichat.js': `'use strict';
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
};`,

    '20240101000002-create-report.js': `'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('reports', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      investigation_id: { type: Sequelize.STRING, allowNull: false },
      filename: { type: Sequelize.STRING, allowNull: false },
      type: { type: Sequelize.STRING, allowNull: false },
      generated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });
    await queryInterface.addIndex('reports', ['investigation_id']);
  },
  down: async (queryInterface) => { await queryInterface.dropTable('reports'); }
};`,

    '20240101000003-create-apiusage.js': `'use strict';
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
};`,

    '20240101000004-create-setting.js': `'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('settings', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      key: { type: Sequelize.STRING, allowNull: false, unique: true },
      value: { type: Sequelize.JSONB, allowNull: false },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });
  },
  down: async (queryInterface) => { await queryInterface.dropTable('settings'); }
};`,

    '20240101000005-create-auditlog.js': `'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('audit_logs', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      event_type: { type: Sequelize.STRING, allowNull: false },
      details: { type: Sequelize.JSONB, allowNull: true },
      timestamp: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });
  },
  down: async (queryInterface) => { await queryInterface.dropTable('audit_logs'); }
};`
};

for (const [file, content] of Object.entries(models)) {
    fs.writeFileSync(path.join(modelsDir, file), content);
}
for (const [file, content] of Object.entries(migrations)) {
    fs.writeFileSync(path.join(migrationsDir, file), content);
}
console.log('Done creating models and migrations.');
