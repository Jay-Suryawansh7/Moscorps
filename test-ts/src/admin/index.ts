import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import AdminJSSequelize from '@adminjs/sequelize';
import db from '../models';
import { Express } from 'express';

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

export { adminJs, adminRouter };