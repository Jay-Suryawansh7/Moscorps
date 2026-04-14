const fs = require("fs-extra");
const path = require("path");

async function generateAdmin(projectDir, options) {
  await fs.ensureDir(path.join(projectDir, "src/admin"));

  const adminContent = `import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import AdminJSSequelize from '@adminjs/sequelize';
import db from '../models';

AdminJS.registerAdapter(AdminJSSequelize);

const adminJs = new AdminJS({
  databases: [(db as any).sequelize],
  rootPath: '/admin',
  resources: Object.values(db as any).filter((model: any) => model.sequelize).map((model: any) => ({
    resource: model,
    options: {
      navigation: { name: 'Admin', icon: 'Database' }
    }
  }))
});

const adminRouter = AdminJSExpress.buildRouter(adminJs);

export { adminJs, adminRouter };`;

  await fs.writeFile(path.join(projectDir, "src/admin/index.ts"), adminContent);

  // Update app.ts to include admin
  const appPath = path.join(projectDir, "src/app.ts");
  let appContent = await fs.readFile(appPath, "utf-8");

  const adminImport = "import { adminJs, adminRouter } from './admin';\n";
  const adminRoute = "\napp.use(adminJs.options.rootPath, adminRouter);\n";

  appContent =
    adminImport +
    appContent.replace("app.get('/health'", adminRoute + "\napp.get('/health'");

  await fs.writeFile(appPath, appContent);
}

module.exports = { generateAdmin };
