const fs = require("fs-extra");
const path = require("path");

async function generateApi(projectDir, options) {
  await fs.ensureDir(path.join(projectDir, "src/routes"));
  await fs.ensureDir(path.join(projectDir, "src/controllers"));

  const entities = options.entities
    .split(",")
    .map((e) => e.trim())
    .filter((e) => e);

  for (const entity of entities) {
    await generateEntityRoutes(projectDir, entity, options);
  }

  await generateRoutesIndex(projectDir, entities, options);
}

async function generateEntityRoutes(projectDir, entity, options) {
  const entityLower = entity.toLowerCase();
  const entityPlural = entityLower + "s";

  const controllerFile = `${entityLower}.controller.ts`;
  const routesFile = `${entityLower}.routes.ts`;
  const modelFile = `${entity}.ts`;

  // Generate model TypeScript
  const modelContent = generateModel(entity, options);
  await fs.writeFile(
    path.join(projectDir, "src/models", modelFile),
    modelContent,
  );

  // Generate controller TypeScript
  const controllerContent = generateController(entity, options);
  await fs.writeFile(
    path.join(projectDir, "src/controllers", controllerFile),
    controllerContent,
  );

  // Generate routes TypeScript
  const routesContent = generateRoutes(entity, options);
  await fs.writeFile(
    path.join(projectDir, "src/routes", routesFile),
    routesContent,
  );
}

function generateModel(entity, options) {
  if (options.db === "mongo") {
    return `import mongoose, { Document, Schema } from 'mongoose';

interface I${entity} extends Document {
  title: string;
  content: string;
  userId: mongoose.Types.ObjectId;
}

const ${entity.toLowerCase()}Schema: Schema = new Schema({
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
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model<I${entity}>('${entity}', ${entity.toLowerCase()}Schema);`;
  }

  return `import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

interface ${entity}Attributes {
  id: number;
  title: string;
  content?: string;
  userId: number;
}

interface ${entity}CreationAttributes {
  title: string;
  content?: string;
  userId: number;
}

class ${entity} extends Model<${entity}Attributes, ${entity}CreationAttributes> {
  public id!: number;
  public title!: string;
  public content!: string;
  public userId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

${entity}.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
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
  },
  {
    sequelize,
    tableName: '${entity}s',
    timestamps: true
  }
);

export default ${entity};`;
}

function generateController(entity, options) {
  const entityLower = entity.toLowerCase();

  return `import { Request, Response, NextFunction } from 'express';
import ${entity} from '../models/${entity}';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

export async function getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const page: number = parseInt(req.query.page as string) || 1;
    const limit: number = parseInt(req.query.limit as string) || 10;
    const offset: number = (page - 1) * limit;
    
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

export async function getOne(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const ${entityLower} = await ${entity}.findByPk(req.params.id, {
      include: [{ model: User, attributes: ['id', 'username', 'email'] }]
    });
    
    if (!${entityLower}) {
      res.status(404).json({ error: '${entity} not found' });
      return;
    }
    
    res.json(${entityLower});
  } catch (error) {
    next(error);
  }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { title, content } = req.body;
    
    const ${entityLower} = await ${entity}.create({
      title,
      content,
      userId: req.user?.userId
    });
    
    res.status(201).json(${entityLower});
  } catch (error) {
    next(error);
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const ${entityLower} = await ${entity}.findByPk(req.params.id);
    
    if (!${entityLower}) {
      res.status(404).json({ error: '${entity} not found' });
      return;
    }
    
    if (${entityLower}.userId !== req.user?.userId) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    
    await ${entityLower}.update(req.body);
    res.json(${entityLower});
  } catch (error) {
    next(error);
  }
}

export async function deleteOne(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const ${entityLower} = await ${entity}.findByPk(req.params.id);
    
    if (!${entityLower}) {
      res.status(404).json({ error: '${entity} not found' });
      return;
    }
    
    if (${entityLower}.userId !== req.user?.userId && req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    
    await ${entityLower}.destroy();
    res.json({ message: '${entity} deleted successfully' });
  } catch (error) {
    next(error);
  }
}`;
}

function generateRoutes(entity, options) {
  const entityLower = entity.toLowerCase();
  const entityPlural = entityLower + "s";

  return `import { Router } from 'express';
import * as ${entityLower}Controller from '../controllers/${entityLower}.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/${entityPlural}', authenticate, ${entityLower}Controller.getAll);
router.get('/${entityPlural}/:id', authenticate, ${entityLower}Controller.getOne);
router.post('/${entityPlural}', authenticate, ${entityLower}Controller.create);
router.put('/${entityPlural}/:id', authenticate, ${entityLower}Controller.update);
router.delete('/${entityPlural}/:id', authenticate, ${entityLower}Controller.deleteOne);

export default router;`;
}

async function generateRoutesIndex(projectDir, entities, options) {
  let imports =
    "import { Router } from 'express';\nconst router = Router();\n\n";

  if (options.auth !== "none") {
    imports +=
      "import authRoutes from './auth.routes';\nrouter.use('/auth', authRoutes);\n\n";
  }

  entities.forEach((entity) => {
    const entityLower = entity.toLowerCase();
    imports += `import ${entityLower}Routes from './${entityLower}.routes';\n`;
  });

  imports += "\n";

  entities.forEach((entity) => {
    const entityLower = entity.toLowerCase();
    imports += `router.use('/api', ${entityLower}Routes);\n`;
  });

  imports += "\nexport default router;";

  await fs.writeFile(path.join(projectDir, "src/routes/index.ts"), imports);
}

module.exports = { generateApi };
