const fs = require("fs-extra");
const path = require("path");

async function generateAdmin(projectDir, options) {
  await fs.ensureDir(path.join(projectDir, "src/admin"));

  const adminContent = `const AdminJS = require('adminjs');
const AdminJSExpress = require('@adminjs/express');
const { Sequelize, DataTypes } = require('sequelize');
const AdminJSSequelize = require('@adminjs/sequelize');
const db = require('../models');

AdminJS.registerAdapter(AdminJSSequelize);

const adminJs = new AdminJS({
  databases: [db.sequelize],
  rootPath: '/admin',
  resources: Object.values(db).filter(model => model.sequelize).map(model => ({
    resource: model,
    options: {
      navigation: { name: 'Admin', icon: 'Database' }
    }
  }))
});

const adminRouter = AdminJSExpress.buildRouter(adminJs);

module.exports = { adminJs, adminRouter };`;

  await fs.writeFile(path.join(projectDir, "src/admin/index.js"), adminContent);

  // Update app.js to include admin
  const appPath = path.join(projectDir, "src/app.js");
  let appContent = await fs.readFile(appPath, "utf-8");

  // Add admin import and route
  const adminImport = "const { adminJs, adminRouter } = require('./admin');\n";
  const adminRoute = "\napp.use(adminJs.options.rootPath, adminRouter);\n";

  appContent =
    adminImport +
    appContent.replace("app.get('/health'", adminRoute + "\napp.get('/health'");

  await fs.writeFile(appPath, appContent);
}

module.exports = { generateAdmin };
