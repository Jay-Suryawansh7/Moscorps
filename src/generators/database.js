const fs = require("fs-extra");
const path = require("path");

async function generateDatabase(projectDir, options) {
  // Create directories
  await fs.ensureDir(path.join(projectDir, "src/config"));
  await fs.ensureDir(path.join(projectDir, "src/models"));

  // Generate database config based on DB type (TypeScript)
  const dbConfig = generateDatabaseConfig(options);
  await fs.writeFile(path.join(projectDir, "src/config/database.ts"), dbConfig);

  // Generate models index (TypeScript)
  const modelsIndex = generateModelsIndex(options);
  await fs.writeFile(path.join(projectDir, "src/models/index.ts"), modelsIndex);

  // Generate User model (TypeScript)
  const userModel = generateUserModel(options);
  await fs.writeFile(path.join(projectDir, "src/models/User.ts"), userModel);
}

function generateDatabaseConfig(options) {
  if (options.db === "mongo") {
    return `import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI: string = process.env.MONGODB_URI || 'mongodb://localhost:27017/' + process.env.npm_package_name;

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err: Error) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

export default mongoose;`;
  }

  // SQL databases (Sequelize)
  if (options.db === "postgres") {
    return `import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'mydb',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    logging: false
  }
);

sequelize.authenticate()
  .then(() => console.log('✅ PostgreSQL connected'))
  .catch((err: Error) => {
    console.error('❌ PostgreSQL connection error:', err);
    process.exit(1);
  });

export default sequelize;`;
  } else if (options.db === "mysql") {
    return `import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'mydb',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    logging: false
  }
);

sequelize.authenticate()
  .then(() => console.log('✅ MySQL connected'))
  .catch((err: Error) => {
    console.error('❌ MySQL connection error:', err);
    process.exit(1);
  });

export default sequelize;`;
  } else {
    // SQLite
    return `import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DB_STORAGE || './database.sqlite',
  logging: false
});

sequelize.authenticate()
  .then(() => console.log('✅ SQLite connected'))
  .catch((err: Error) => {
    console.error('❌ SQLite connection error:', err);
    process.exit(1);
  });

export default sequelize;`;
  }
}

function generateModelsIndex(options) {
  if (options.db === "mongo") {
    return `import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

const db: { [key: string]: mongoose.Model<any> } = {};

fs.readdirSync(__dirname)
  .filter(file => file !== 'index.ts' && file.endsWith('.ts'))
  .forEach(file => {
    const model = require(path.join(__dirname, file));
    db[model.modelName] = model;
  });

export default db;`;
  }

  // SQL (Sequelize) TypeScript
  return `import fs from 'fs';
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

export default db;`;
}

function generateUserModel(options) {
  if (options.db === "mongo") {
    return `import mongoose, { Document, Schema } from 'mongoose';

interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
}

const userSchema: Schema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
}, {
  timestamps: true
});

export default mongoose.model<IUser>('User', userSchema);`;
  }

  // SQL (Sequelize) TypeScript
  return `import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../config/database';

interface UserAttributes {
  id: number;
  username: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
}

interface UserCreationAttributes {
  username: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
}

class User extends Model<UserAttributes, UserCreationAttributes> {
  public id!: number;
  public username!: string;
  public email!: string;
  public password!: string;
  public role!: 'user' | 'admin';

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 30]
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      defaultValue: 'user'
    }
  },
  {
    sequelize,
    tableName: 'Users',
    timestamps: true
  }
);

export default User;`;
}

module.exports = { generateDatabase };
