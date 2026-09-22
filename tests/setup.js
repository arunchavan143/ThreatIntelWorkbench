const db = require('../src/models');

afterAll(async () => {
    await db.sequelize.close();
});
