import fs from 'fs';
import path from 'path';
import sequelize from '../config/database';
import { Sequelize, DataTypes, Model, ModelCtor } from 'sequelize';

interface DB {
  [key: string]: ModelCtor<Model<any, any>>;
  sequelize: Sequelize;
  Sequelize: typeof Sequelize;
}

const db: DB = {} as DB;

fs.readdirSync(__dirname)
  .filter(file => file !== 'index.ts' && file.endsWith('.ts'))
  .forEach(file => {
    const model = require(path.join(__dirname, file)).default(sequelize, DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;