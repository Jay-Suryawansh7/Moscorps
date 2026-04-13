const fs = require("fs-extra");
const path = require("path");

async function generateDatabase(projectDir, options) {
  // Create directories
  await fs.ensureDir(path.join(projectDir, "src/config"));
  await fs.ensureDir(path.join(projectDir, "src/models"));

  // Generate database config based on DB type
  const dbConfig = generateDatabaseConfig(options);
  await fs.writeFile(path.join(projectDir, "src/config/database.js"), dbConfig);

  // Generate models index
  const modelsIndex = generateModelsIndex(options);
  await fs.writeFile(path.join(projectDir, "src/models/index.js"), modelsIndex);

  // Generate User model
  const userModel = generateUserModel(options);
  await fs.writeFile(path.join(projectDir, "src/models/User.js"), userModel);
}

function generateDatabaseConfig(options) {
  if (options.db === "mongo") {
    return `const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/' + process.env.npm_package_name;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

module.exports = mongoose;`;
  }

  // SQL databases (Sequelize)
  let config = "";

  if (options.db === "postgres") {
    config = `const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'mydb',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

sequelize.authenticate()
  .then(() => console.log('✅ PostgreSQL connected'))
  .catch(err => {
    console.error('❌ PostgreSQL connection error:', err);
    process.exit(1);
  });

module.exports = sequelize;`;
  } else if (options.db === "mysql") {
    config = `const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'mydb',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false
  }
);

sequelize.authenticate()
  .then(() => console.log('✅ MySQL connected'))
  .catch(err => {
    console.error('❌ MySQL connection error:', err);
    process.exit(1);
  });

module.exports = sequelize;`;
  } else {
    // SQLite
    config = `const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DB_STORAGE || './database.sqlite',
  logging: false
});

sequelize.authenticate()
  .then(() => console.log('✅ SQLite connected'))
  .catch(err => {
    console.error('❌ SQLite connection error:', err);
    process.exit(1);
  });

module.exports = sequelize;`;
  }

  return config;
}

function generateModelsIndex(options) {
  if (options.db === "mongo") {
    return `const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const db = {};

fs.readdirSync(__dirname)
  .filter(file => file !== 'index.js' && file.endsWith('.js'))
  .forEach(file => {
    const model = require(path.join(__dirname, file));
    db[model.modelName] = model;
  });

module.exports = db;`;
  }

  // SQL (Sequelize)
  return `const fs = require('fs');
const path = require('path');
const sequelize = require('../config/database');
const Sequelize = require('sequelize');

const db = {};

fs.readdirSync(__dirname)
  .filter(file => file !== 'index.js' && file.endsWith('.js'))
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;`;
}

function generateUserModel(options) {
  if (options.db === "mongo") {
    return `const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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

module.exports = mongoose.model('User', userSchema);`;
  }

  // SQL (Sequelize)
  return `module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
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
  }, {
    timestamps: true
  });

  User.associate = (models) => {
    // Add associations here
  };

  return User;
};`;
}

module.exports = { generateDatabase };
