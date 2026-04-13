const fs = require("fs-extra");
const path = require("path");

async function generateApi(projectDir, options) {
  await fs.ensureDir(path.join(projectDir, "src/routes"));
  await fs.ensureDir(path.join(projectDir, "src/controllers"));

  const entities = options.entities
    .split(",")
    .map((e) => e.trim())
    .filter((e) => e);

  // Generate routes for each entity
  for (const entity of entities) {
    await generateEntityRoutes(projectDir, entity, options);
  }

  // Generate main routes index
  await generateRoutesIndex(projectDir, entities, options);
}

async function generateEntityRoutes(projectDir, entity, options) {
  const entityLower = entity.toLowerCase();
  const entityPlural = entityLower + "s";

  const controllerFile = `${entityLower}.controller.js`;
  const routesFile = `${entityLower}.routes.js`;
  const modelFile = `${entity}.js`;

  // Generate model
  const modelContent = generateModel(entity, options);
  await fs.writeFile(
    path.join(projectDir, "src/models", modelFile),
    modelContent,
  );

  // Generate controller
  const controllerContent = generateController(entity, options);
  await fs.writeFile(
    path.join(projectDir, "src/controllers", controllerFile),
    controllerContent,
  );

  // Generate routes
  const routesContent = generateRoutes(entity, options);
  await fs.writeFile(
    path.join(projectDir, "src/routes", routesFile),
    routesContent,
  );
}

function generateModel(entity, options) {
  if (options.db === "mongo") {
    return `const mongoose = require('mongoose');

const ${entity.toLowerCase()}Schema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    default: ''
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('${entity}', ${entity.toLowerCase()}Schema);`;
  }

  return `module.exports = (sequelize, DataTypes) => {
  const ${entity} = sequelize.define('${entity}', {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 200]
      }
    },
    content: {
      type: DataTypes.TEXT
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    timestamps: true
  });

  ${entity}.associate = (models) => {
    ${entity}.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return ${entity};
};`;
}

function generateController(entity, options) {
  const entityLower = entity.toLowerCase();

  return `const { ${entity} } = require('../models');
const { User } = require('../models');

async function getAll(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const { count, rows } = await ${entity}.findAndCountAll({
      include: [{ model: User, attributes: ['id', 'username', 'email'] }],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      ${entityLower}s: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    next(error);
  }
}

async function getOne(req, res, next) {
  try {
    const ${entityLower} = await ${entity}.findByPk(req.params.id, {
      include: [{ model: User, attributes: ['id', 'username', 'email'] }]
    });
    
    if (!${entityLower}) {
      return res.status(404).json({ error: '${entity} not found' });
    }
    
    res.json(${entityLower});
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const { title, content } = req.body;
    
    const ${entityLower} = await ${entity}.create({
      title,
      content,
      userId: req.user.userId
    });
    
    res.status(201).json(${entityLower});
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const ${entityLower} = await ${entity}.findByPk(req.params.id);
    
    if (!${entityLower}) {
      return res.status(404).json({ error: '${entity} not found' });
    }
    
    if (${entityLower}.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    await ${entityLower}.update(req.body);
    res.json(${entityLower});
  } catch (error) {
    next(error);
  }
}

async function deleteOne(req, res, next) {
  try {
    const ${entityLower} = await ${entity}.findByPk(req.params.id);
    
    if (!${entityLower}) {
      return res.status(404).json({ error: '${entity} not found' });
    }
    
    if (${entityLower}.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    await ${entityLower}.destroy();
    res.json({ message: '${entity} deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = { getAll, getOne, create, update, deleteOne };`;
}

function generateRoutes(entity, options) {
  const entityLower = entity.toLowerCase();
  const entityPlural = entityLower + "s";

  return `const express = require('express');
const router = express.Router();
const ${entityLower}Controller = require('../controllers/${entityLower}.controller');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/${entityPlural}', authenticate, ${entityLower}Controller.getAll);
router.get('/${entityPlural}/:id', authenticate, ${entityLower}Controller.getOne);
router.post('/${entityPlural}', authenticate, ${entityLower}Controller.create);
router.put('/${entityPlural}/:id', authenticate, ${entityLower}Controller.update);
router.delete('/${entityPlural}/:id', authenticate, ${entityLower}Controller.deleteOne);

module.exports = router;`;
}

async function generateRoutesIndex(projectDir, entities, options) {
  let imports =
    "const express = require('express');\nconst router = express.Router();\n\n";

  // Import auth routes if auth is enabled
  if (options.auth !== "none") {
    imports +=
      "const authRoutes = require('./auth.routes');\nrouter.use('/auth', authRoutes);\n\n";
  }

  // Import entity routes
  entities.forEach((entity) => {
    const entityLower = entity.toLowerCase();
    imports += `const ${entityLower}Routes = require('./${entityLower}.routes');\n`;
  });

  imports += "\n";

  entities.forEach((entity) => {
    const entityLower = entity.toLowerCase();
    imports += `router.use('/api', ${entityLower}Routes);\n`;
  });

  imports += "\nmodule.exports = router;";

  await fs.writeFile(path.join(projectDir, "src/routes/index.js"), imports);
}

module.exports = { generateApi };
