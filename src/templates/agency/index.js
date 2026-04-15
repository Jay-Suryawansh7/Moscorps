const fs = require("fs-extra");
const path = require("path");

async function generateAgencyTemplate(projectDir, options) {
  console.log("🏢 Generating Agency template...");

  await generateAgencySchemas(projectDir, options);
  await generateAgencyRoutes(projectDir, options);
  await generateAgencyControllers(projectDir, options);

  console.log("✅ Agency template generated!");
}

async function generateAgencySchemas(projectDir, options) {
  const modelsDir = path.join(projectDir, "src/models");

  const clientModel = `import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Client extends Model {
  id!: number;
  name!: string;
  email!: string;
  company!: string;
  phone?: string;
  status!: 'active' | 'inactive';
}

Client.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  company: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' }
}, { sequelize, tableName: 'clients', timestamps: true });

export default Client;
`;

  const projectModel = `import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Project extends Model {
  id!: number;
  clientId!: number;
  name!: string;
  description?: string;
  status!: 'planning' | 'in-progress' | 'completed' | 'on-hold';
  budget!: number;
  startDate!: Date;
  endDate?: Date;
}

Project.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  clientId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('planning', 'in-progress', 'completed', 'on-hold'), defaultValue: 'planning' },
  budget: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  startDate: { type: DataTypes.DATE },
  endDate: { type: DataTypes.DATE }
}, { sequelize, tableName: 'projects', timestamps: true });

export default Project;
`;

  const invoiceModel = `import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Invoice extends Model {
  id!: number;
  projectId!: number;
  invoiceNumber!: string;
  amount!: number;
  status!: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate!: Date;
  issuedDate!: Date;
}

Invoice.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  projectId: { type: DataTypes.INTEGER, allowNull: false },
  invoiceNumber: { type: DataTypes.STRING, unique: true },
  amount: { type: DataTypes.DECIMAL(10, 2) },
  status: { type: DataTypes.ENUM('draft', 'sent', 'paid', 'overdue'), defaultValue: 'draft' },
  dueDate: { type: DataTypes.DATE },
  issuedDate: { type: DataTypes.DATE, defaultValue: () => new Date() }
}, { sequelize, tableName: 'invoices', timestamps: true });

export default Invoice;
`;

  await fs.writeFile(path.join(modelsDir, "Client.ts"), clientModel);
  await fs.writeFile(path.join(modelsDir, "Project.ts"), projectModel);
  await fs.writeFile(path.join(modelsDir, "Invoice.ts"), invoiceModel);
}

async function generateAgencyRoutes(projectDir, options) {
  const routesDir = path.join(projectDir, "src/routes");

  const clientRoutes = `import { Router } from 'express';
import * as clientController from '../controllers/client.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/', clientController.list);
router.get('/:id', clientController.getOne);
router.post('/', clientController.create);
router.put('/:id', clientController.update);
router.delete('/:id', clientController.deleteOne);
export default router;
`;

  const projectRoutes = `import { Router } from 'express';
import * as projectController from '../controllers/project.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/', projectController.list);
router.get('/:id', projectController.getOne);
router.post('/', projectController.create);
router.put('/:id', projectController.update);
router.delete('/:id', projectController.deleteOne);
export default router;
`;

  const invoiceRoutes = `import { Router } from 'express';
import * as invoiceController from '../controllers/invoice.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/', invoiceController.list);
router.get('/:id', invoiceController.getOne);
router.post('/', invoiceController.create);
router.put('/:id', invoiceController.update);
router.delete('/:id', invoiceController.deleteOne);
export default router;
`;

  await fs.writeFile(path.join(routesDir, "client.routes.ts"), clientRoutes);
  await fs.writeFile(path.join(routesDir, "project.routes.ts"), projectRoutes);
  await fs.writeFile(path.join(routesDir, "invoice.routes.ts"), invoiceRoutes);
}

async function generateAgencyControllers(projectDir, options) {
  const controllersDir = path.join(projectDir, "src/controllers");

  const clientController = `import { Request, Response, NextFunction } from 'express';
import Client from '../models/Client.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { count, rows } = await Client.findAndCountAll({ limit: 10, offset: 0 });
    res.json({ clients: rows, total: count });
  } catch (error) { next(error); }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json({ client });
  } catch (error) { next(error); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const client = await Client.create(req.body);
    res.status(201).json({ client });
  } catch (error) { next(error); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    await client.update(req.body);
    res.json({ client });
  } catch (error) { next(error); }
}

export async function deleteOne(req: Request, res: Response, next: NextFunction) {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    await client.destroy();
    res.json({ message: 'Client deleted' });
  } catch (error) { next(error); }
}
`;

  const projectController = `import { Request, Response, NextFunction } from 'express';
import Project from '../models/Project.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const projects = await Project.findAll({ limit: 10 });
    res.json({ projects });
  } catch (error) { next(error); }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project });
  } catch (error) { next(error); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await Project.create(req.body);
    res.status(201).json({ project });
  } catch (error) { next(error); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    await project.update(req.body);
    res.json({ project });
  } catch (error) { next(error); }
}

export async function deleteOne(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    await project.destroy();
    res.json({ message: 'Project deleted' });
  } catch (error) { next(error); }
}
`;

  const invoiceController = `import { Request, Response, NextFunction } from 'express';
import Invoice from '../models/Invoice.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const invoices = await Invoice.findAll({ limit: 10 });
    res.json({ invoices });
  } catch (error) { next(error); }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ invoice });
  } catch (error) { next(error); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await Invoice.create(req.body);
    res.status(201).json({ invoice });
  } catch (error) { next(error); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    await invoice.update(req.body);
    res.json({ invoice });
  } catch (error) { next(error); }
}

export async function deleteOne(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    await invoice.destroy();
    res.json({ message: 'Invoice deleted' });
  } catch (error) { next(error); }
}
`;

  await fs.writeFile(
    path.join(controllersDir, "client.controller.ts"),
    clientController,
  );
  await fs.writeFile(
    path.join(controllersDir, "project.controller.ts"),
    projectController,
  );
  await fs.writeFile(
    path.join(controllersDir, "invoice.controller.ts"),
    invoiceController,
  );
}

module.exports = { generateAgencyTemplate };
