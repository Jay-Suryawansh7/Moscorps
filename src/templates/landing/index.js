const fs = require("fs-extra");
const path = require("path");

async function generateLandingTemplate(projectDir, options) {
  console.log("🚀 Generating Landing template...");

  const modelsDir = path.join(projectDir, "src/models");
  const routesDir = path.join(projectDir, "src/routes");
  const controllersDir = path.join(projectDir, "src/controllers");

  // Lead model
  await fs.writeFile(
    path.join(modelsDir, "Lead.ts"),
    `import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Lead extends Model {
  id!: number;
  email!: string;
  name?: string;
  source?: string;
  status!: 'new' | 'contacted' | 'qualified' | 'converted';
}

Lead.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  email: { type: DataTypes.STRING, allowNull: false },
  name: { type: DataTypes.STRING },
  source: { type: DataTypes.STRING, defaultValue: 'website' },
  status: { type: DataTypes.ENUM('new', 'contacted', 'qualified', 'converted'), defaultValue: 'new' }
}, { sequelize, tableName: 'leads', timestamps: true });

export default Lead;
`,
  );

  // Subscriber model
  await fs.writeFile(
    path.join(modelsDir, "Subscriber.ts"),
    `import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Subscriber extends Model {
  id!: number;
  email!: string;
  status!: 'active' | 'unsubscribed';
}

Subscriber.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  status: { type: DataTypes.ENUM('active', 'unsubscribed'), defaultValue: 'active' }
}, { sequelize, tableName: 'subscribers', timestamps: true });

export default Subscriber;
`,
  );

  // AnalyticsEvent model
  await fs.writeFile(
    path.join(modelsDir, "AnalyticsEvent.ts"),
    `import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class AnalyticsEvent extends Model {
  id!: number;
  eventType!: string;
  eventData?: any;
  sessionId?: string;
}

AnalyticsEvent.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  eventType: { type: DataTypes.STRING, allowNull: false },
  eventData: { type: DataTypes.JSONB },
  sessionId: { type: DataTypes.STRING }
}, { sequelize, tableName: 'analytics_events', timestamps: true });

export default AnalyticsEvent;
`,
  );

  // Routes
  const leadRoutes = `import { Router } from 'express';
import * as leadController from '../controllers/lead.controller';

const router = Router();
router.get('/', leadController.list);
router.post('/', leadController.create);
router.get('/:id', leadController.getOne);
router.put('/:id', leadController.update);
router.delete('/:id', leadController.deleteOne);
export default router;
`;

  await fs.writeFile(path.join(routesDir, "lead.routes.ts"), leadRoutes);

  // Controllers
  const leadController = `import { Request, Response, NextFunction } from 'express';
import Lead from '../models/Lead.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const leads = await Lead.findAll({ limit: 20, order: [['createdAt', 'DESC']] });
    res.json({ leads });
  } catch (error) { next(error); }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const lead = await Lead.findByPk(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json({ lead });
  } catch (error) { next(error); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const lead = await Lead.create(req.body);
    res.status(201).json({ lead });
  } catch (error) { next(error); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const lead = await Lead.findByPk(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    await lead.update(req.body);
    res.json({ lead });
  } catch (error) { next(error); }
}

export async function deleteOne(req: Request, res: Response, next: NextFunction) {
  try {
    const lead = await Lead.findByPk(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    await lead.destroy();
    res.json({ message: 'Lead deleted' });
  } catch (error) { next(error); }
}
`;

  await fs.writeFile(
    path.join(controllersDir, "lead.controller.ts"),
    leadController,
  );

  console.log("✅ Landing template generated!");
}

module.exports = { generateLandingTemplate };
