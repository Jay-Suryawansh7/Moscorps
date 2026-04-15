const fs = require("fs-extra");
const path = require("path");

async function generateMarketplaceTemplate(projectDir, options) {
  console.log("🏪 Generating Marketplace template...");

  const modelsDir = path.join(projectDir, "src/models");
  const routesDir = path.join(projectDir, "src/routes");
  const controllersDir = path.join(projectDir, "src/controllers");

  // Listing model
  await fs.writeFile(
    path.join(modelsDir, "Listing.ts"),
    `import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Listing extends Model {
  id!: number;
  sellerId!: number;
  title!: string;
  description?: string;
  price!: number;
  status!: 'active' | 'sold' | 'inactive';
}

Listing.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  sellerId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  status: { type: DataTypes.ENUM('active', 'sold', 'inactive'), defaultValue: 'active' }
}, { sequelize, tableName: 'listings', timestamps: true });

export default Listing;
`,
  );

  // Transaction model
  await fs.writeFile(
    path.join(modelsDir, "Transaction.ts"),
    `import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Transaction extends Model {
  id!: number;
  listingId!: number;
  buyerId!: number;
  sellerId!: number;
  amount!: number;
  status!: 'pending' | 'completed' | 'disputed' | 'refunded';
}

Transaction.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  listingId: { type: DataTypes.INTEGER, allowNull: false },
  buyerId: { type: DataTypes.INTEGER, allowNull: false },
  sellerId: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'completed', 'disputed', 'refunded'), defaultValue: 'pending' }
}, { sequelize, tableName: 'transactions', timestamps: true });

export default Transaction;
`,
  );

  // Review model (already exists in ecommerce, but marketplace-specific)
  await fs.writeFile(
    path.join(modelsDir, "Review.ts"),
    `import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Review extends Model {
  id!: number;
  reviewerId!: number;
  revieweeId!: number;
  transactionId?: number;
  rating!: number;
  comment?: string;
}

Review.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  reviewerId: { type: DataTypes.INTEGER, allowNull: false },
  revieweeId: { type: DataTypes.INTEGER, allowNull: false },
  transactionId: { type: DataTypes.INTEGER },
  rating: { type: DataTypes.INTEGER, validate: { min: 1, max: 5 } },
  comment: { type: DataTypes.TEXT }
}, { sequelize, tableName: 'reviews', timestamps: true });

export default Review;
`,
  );

  // Routes
  const listingRoutes = `import { Router } from 'express';
import * as listingController from '../controllers/listing.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.get('/', listingController.list);
router.get('/:id', listingController.getOne);
router.post('/', authenticate, listingController.create);
router.put('/:id', authenticate, listingController.update);
router.delete('/:id', authenticate, listingController.deleteOne);
export default router;
`;

  await fs.writeFile(path.join(routesDir, "listing.routes.ts"), listingRoutes);

  // Controllers
  const listingController = `import { Request, Response, NextFunction } from 'express';
import Listing from '../models/Listing.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const listings = await Listing.findAll({ 
      where: { status: 'active' },
      limit: 20,
      order: [['createdAt', 'DESC']]
    });
    res.json({ listings });
  } catch (error) { next(error); }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const listing = await Listing.findByPk(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json({ listing });
  } catch (error) { next(error); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const listing = await Listing.create({ ...req.body, sellerId: req.user?.userId });
    res.status(201).json({ listing });
  } catch (error) { next(error); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const listing = await Listing.findByPk(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    await listing.update(req.body);
    res.json({ listing });
  } catch (error) { next(error); }
}

export async function deleteOne(req: Request, res: Response, next: NextFunction) {
  try {
    const listing = await Listing.findByPk(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    await listing.destroy();
    res.json({ message: 'Listing deleted' });
  } catch (error) { next(error); }
}
`;

  await fs.writeFile(
    path.join(controllersDir, "listing.controller.ts"),
    listingController,
  );

  console.log("✅ Marketplace template generated!");
}

module.exports = { generateMarketplaceTemplate };
