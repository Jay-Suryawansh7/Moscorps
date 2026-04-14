const fs = require("fs-extra");
const path = require("path");

/**
 * Generate E-commerce template with products, cart, orders, and inventory
 */
async function generateEcommerceTemplate(projectDir, options) {
  console.log("🛒 Generating E-commerce template...");

  // Generate E-commerce schemas
  await generateEcommerceSchemas(projectDir, options);

  // Generate E-commerce routes
  await generateEcommerceRoutes(projectDir, options);

  // Generate E-commerce controllers
  await generateEcommerceControllers(projectDir, options);

  // Generate E-commerce services
  await generateEcommerceServices(projectDir, options);

  // Update package.json with additional dependencies
  await updateEcommerceDependencies(projectDir);

  console.log("✅ E-commerce template generated successfully!");
  console.log(
    "   Added: Products, Variants, Inventory, Carts, Orders, Reviews",
  );
}

async function generateEcommerceSchemas(projectDir, options) {
  const modelsDir = path.join(projectDir, "src/models");

  // Product model
  const productModel = `import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../config/database';

interface ProductAttributes {
  id: number;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  isActive: boolean;
}

interface ProductCreationAttributes {
  name: string;
  slug: string;
  description?: string;
  basePrice?: number;
  isActive?: boolean;
}

class Product extends Model<ProductAttributes, ProductCreationAttributes> {
  public id!: number;
  public name!: string;
  public slug!: string;
  public description!: string;
  public basePrice!: number;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Product.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 200]
      }
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        is: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    basePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    sequelize,
    tableName: 'products',
    timestamps: true
  }
);

export default Product;
`;

  // ProductVariant model
  const variantModel = `import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

interface ProductVariantAttributes {
  id: number;
  productId: number;
  sku: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  inventory: number;
  lowStockThreshold: number;
}

interface ProductVariantCreationAttributes {
  productId: number;
  sku: string;
  name: string;
  price?: number;
  compareAtPrice?: number;
  inventory?: number;
  lowStockThreshold?: number;
}

class ProductVariant extends Model<ProductVariantAttributes, ProductVariantCreationAttributes> {
  public id!: number;
  public productId!: number;
  public sku!: string;
  public name!: string;
  public price!: number;
  public compareAtPrice?: number;
  public inventory!: number;
  public lowStockThreshold!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ProductVariant.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 100]
      }
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    compareAtPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    inventory: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    lowStockThreshold: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5
    }
  },
  {
    sequelize,
    tableName: 'product_variants',
    timestamps: true
  }
);

export default ProductVariant;
`;

  // Cart model
  const cartModel = `import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

interface CartAttributes {
  id: number;
  userId?: number;
  sessionId?: string;
  status: 'active' | 'abandoned' | 'converted';
}

interface CartCreationAttributes {
  userId?: number;
  sessionId?: string;
  status?: 'active' | 'abandoned' | 'converted';
}

class Cart extends Model<CartAttributes, CartCreationAttributes> {
  public id!: number;
  public userId?: number;
  public sessionId?: string;
  public status!: 'active' | 'abandoned' | 'converted';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Cart.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'abandoned', 'converted'),
      defaultValue: 'active'
    }
  },
  {
    sequelize,
    tableName: 'carts',
    timestamps: true
  }
);

export default Cart;
`;

  // CartItem model
  const cartItemModel = `import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

interface CartItemAttributes {
  id: number;
  cartId: number;
  variantId: number;
  quantity: number;
}

interface CartItemCreationAttributes {
  cartId: number;
  variantId: number;
  quantity?: number;
}

class CartItem extends Model<CartItemAttributes, CartItemCreationAttributes> {
  public id!: number;
  public cartId!: number;
  public variantId!: number;
  public quantity!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CartItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    cartId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    variantId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1
      }
    }
  },
  {
    sequelize,
    tableName: 'cart_items',
    timestamps: true
  }
);

export default CartItem;
`;

  // Order model
  const orderModel = `import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

interface OrderAttributes {
  id: number;
  userId?: number;
  orderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: string;
  billingAddress: string;
}

interface OrderCreationAttributes {
  userId?: number;
  orderNumber: string;
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal?: number;
  tax?: number;
  shipping?: number;
  total?: number;
  shippingAddress?: string;
  billingAddress?: string;
}

class Order extends Model<OrderAttributes, OrderCreationAttributes> {
  public id!: number;
  public userId?: number;
  public orderNumber!: string;
  public status!: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  public subtotal!: number;
  public tax!: number;
  public shipping!: number;
  public total!: number;
  public shippingAddress!: string;
  public billingAddress!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    orderNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled'),
      defaultValue: 'pending'
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    tax: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    shipping: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    shippingAddress: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    billingAddress: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'orders',
    timestamps: true
  }
);

export default Order;
`;

  // OrderItem model
  const orderItemModel = `import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

interface OrderItemAttributes {
  id: number;
  orderId: number;
  variantId: number;
  productName: string;
  variantName: string;
  quantity: number;
  price: number;
}

interface OrderItemCreationAttributes {
  orderId: number;
  variantId: number;
  productName: string;
  variantName: string;
  quantity?: number;
  price: number;
}

class OrderItem extends Model<OrderItemAttributes, OrderItemCreationAttributes> {
  public id!: number;
  public orderId!: number;
  public variantId!: number;
  public productName!: string;
  public variantName!: string;
  public quantity!: number;
  public price!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

OrderItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    variantId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    productName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    variantName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'order_items',
    timestamps: true
  }
);

export default OrderItem;
`;

  // Review model
  const reviewModel = `import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

interface ReviewAttributes {
  id: number;
  productId: number;
  userId: number;
  rating: number;
  title?: string;
  comment?: string;
  isVerifiedPurchase: boolean;
  isActive: boolean;
}

interface ReviewCreationAttributes {
  productId: number;
  userId: number;
  rating: number;
  title?: string;
  comment?: string;
  isVerifiedPurchase?: boolean;
  isActive?: boolean;
}

class Review extends Model<ReviewAttributes, ReviewCreationAttributes> {
  public id!: number;
  public productId!: number;
  public userId!: number;
  public rating!: number;
  public title?: string;
  public comment?: string;
  public isVerifiedPurchase!: boolean;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Review.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isVerifiedPurchase: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    sequelize,
    tableName: 'reviews',
    timestamps: true
  }
);

export default Review;
`;

  await fs.writeFile(path.join(modelsDir, "Product.ts"), productModel);
  await fs.writeFile(path.join(modelsDir, "ProductVariant.ts"), variantModel);
  await fs.writeFile(path.join(modelsDir, "Cart.ts"), cartModel);
  await fs.writeFile(path.join(modelsDir, "CartItem.ts"), cartItemModel);
  await fs.writeFile(path.join(modelsDir, "Order.ts"), orderModel);
  await fs.writeFile(path.join(modelsDir, "OrderItem.ts"), orderItemModel);
  await fs.writeFile(path.join(modelsDir, "Review.ts"), reviewModel);
}

async function generateEcommerceRoutes(projectDir, options) {
  const routesDir = path.join(projectDir, "src/routes");

  // Products routes
  const productRoutes = `import { Router } from 'express';
import * as productController from '../controllers/product.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', productController.list);
router.get('/:slug', productController.getBySlug);

// Protected routes
router.post('/', authenticate, productController.create);
router.put('/:id', authenticate, productController.update);
router.delete('/:id', authenticate, productController.deleteOne);

export default router;
`;

  // Cart routes
  const cartRoutes = `import { Router } from 'express';
import * as cartController from '../controllers/cart.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/items', cartController.addItem);
router.put('/items/:itemId', cartController.updateItem);
router.delete('/items/:itemId', cartController.removeItem);
router.post('/checkout', cartController.checkout);

export default router;
`;

  // Orders routes
  const orderRoutes = `import { Router } from 'express';
import * as orderController from '../controllers/order.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', orderController.list);
router.get('/:id', orderController.getOne);
router.post('/:orderId/cancel', orderController.cancel);

export default router;
`;

  // Reviews routes
  const reviewRoutes = `import { Router } from 'express';
import * as reviewController from '../controllers/review.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/product/:productId', reviewController.getByProduct);
router.post('/', authenticate, reviewController.create);
router.put('/:id', authenticate, reviewController.update);
router.delete('/:id', authenticate, reviewController.deleteOne);

export default router;
`;

  await fs.writeFile(path.join(routesDir, "product.routes.ts"), productRoutes);
  await fs.writeFile(path.join(routesDir, "cart.routes.ts"), cartRoutes);
  await fs.writeFile(path.join(routesDir, "order.routes.ts"), orderRoutes);
  await fs.writeFile(path.join(routesDir, "review.routes.ts"), reviewRoutes);
}

async function generateEcommerceControllers(projectDir, options) {
  const controllersDir = path.join(projectDir, "src/controllers");

  // Product controller
  const productController = `import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product.js';
import ProductVariant from '../models/ProductVariant.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, minPrice, maxPrice } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    const where: any = { isActive: true };
    
    if (search) {
      // Simple search without Sequelize.Op
      where.name = search;
    }
    
    const { count, rows } = await Product.findAndCountAll({
      where,
      limit,
      offset,
      include: [{ model: ProductVariant }]
    });
    
    res.json({ 
      products: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    next(error);
  }
}

export async function getBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await Product.findOne({
      where: { slug: req.params.slug },
      include: [{ model: ProductVariant }]
    });
    
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    
    res.json({ product });
  } catch (error) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, slug, description, basePrice, variants } = req.body;
    
    const product = await Product.create({
      name,
      slug,
      description,
      basePrice
    });
    
    if (variants && Array.isArray(variants)) {
      await ProductVariant.bulkCreate(
        variants.map((v: any) => ({ ...v, productId: product.id }))
      );
    }
    
    res.status(201).json({ product });
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    
    await product.update(req.body);
    res.json({ product });
  } catch (error) {
    next(error);
  }
}

export async function deleteOne(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    
    await product.destroy();
    res.json({ message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
}
`;

  // Cart controller
  const cartController = `import { Request, Response, NextFunction } from 'express';
import Cart from '../models/Cart.js';
import CartItem from '../models/CartItem.js';
import ProductVariant from '../models/ProductVariant.js';
import { AuthRequest } from '../middleware/auth';

export async function getCart(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const sessionId = Array.isArray(req.headers['x-session-id']) 
      ? req.headers['x-session-id'][0] 
      : req.headers['x-session-id'];
    
    let cart = await Cart.findOne({
      where: userId ? { userId } : { sessionId: sessionId as string },
      include: [{
        model: CartItem,
        include: [{ model: ProductVariant }]
      }]
    });
    
    if (!cart) {
      cart = await Cart.create({
        userId,
        sessionId: !userId ? req.headers['x-session-id'] : undefined
      });
    }
    
    res.json({ cart });
  } catch (error) {
    next(error);
  }
}

export async function addItem(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const { variantId, quantity } = req.body;
    
    const sessionId = Array.isArray(req.headers['x-session-id']) 
      ? req.headers['x-session-id'][0] 
      : req.headers['x-session-id'];
      
    let cart = await Cart.findOne({
      where: userId ? { userId } : { sessionId: sessionId as string }
    });
    
    if (!cart) {
      cart = await Cart.create({
        userId,
        sessionId: !userId ? req.headers['x-session-id'] : undefined
      });
    }
    
    let item = await CartItem.findOne({
      where: {
        cartId: cart.id,
        variantId
      }
    });
    
    if (item) {
      await item.update({
        quantity: item.quantity + quantity
      });
    } else {
      item = await CartItem.create({
        cartId: cart.id,
        variantId,
        quantity
      });
    }
    
    res.json({ item });
  } catch (error) {
    next(error);
  }
}

export async function updateItem(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const item = await CartItem.findByPk(req.params.itemId);
    if (!item) {
      res.status(404).json({ error: 'Cart item not found' });
      return;
    }
    
    await item.update(req.body);
    res.json({ item });
  } catch (error) {
    next(error);
  }
}

export async function removeItem(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const item = await CartItem.findByPk(req.params.itemId);
    if (!item) {
      res.status(404).json({ error: 'Cart item not found' });
      return;
    }
    
    await item.destroy();
    res.json({ message: 'Item removed' });
  } catch (error) {
    next(error);
  }
}

export async function checkout(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // Placeholder for checkout logic
    res.json({ 
      message: 'Checkout would be implemented here',
      url: 'https://checkout.stripe.com/...'
    });
  } catch (error) {
    next(error);
  }
}
`;

  // Order controller
  const orderController = `import { Request, Response, NextFunction } from 'express';
import Order from '../models/Order.js';
import { AuthRequest } from '../middleware/auth';

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const orders = await Order.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
    res.json({ orders });
  } catch (error) {
    next(error);
  }
}

export async function getOne(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json({ order });
  } catch (error) {
    next(error);
  }
}

export async function cancel(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await Order.findByPk(req.params.orderId);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    
    await order.update({ status: 'cancelled' });
    res.json({ message: 'Order cancelled' });
  } catch (error) {
    next(error);
  }
}
`;

  // Review controller
  const reviewController = `import { Request, Response, NextFunction } from 'express';
import Review from '../models/Review.js';
import { AuthRequest } from '../middleware/auth';

export async function getByProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const reviews = await Review.findAll({
      where: {
        productId: req.params.productId,
        isActive: true
      }
    });
    res.json({ reviews });
  } catch (error) {
    next(error);
  }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { productId, rating, title, comment } = req.body;
    const userId = req.user?.userId!;
    
    const review = await Review.create({
      productId,
      userId,
      rating,
      title,
      comment
    });
    
    res.status(201).json({ review });
  } catch (error) {
    next(error);
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }
    
    await review.update(req.body);
    res.json({ review });
  } catch (error) {
    next(error);
  }
}

export async function deleteOne(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }
    
    await review.destroy();
    res.json({ message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
}
`;

  await fs.writeFile(
    path.join(controllersDir, "product.controller.ts"),
    productController,
  );
  await fs.writeFile(
    path.join(controllersDir, "cart.controller.ts"),
    cartController,
  );
  await fs.writeFile(
    path.join(controllersDir, "order.controller.ts"),
    orderController,
  );
  await fs.writeFile(
    path.join(controllersDir, "review.controller.ts"),
    reviewController,
  );
}

async function generateEcommerceServices(projectDir, options) {
  const servicesDir = path.join(projectDir, "src/services");

  // Order service
  const orderService = `import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import CartItem from '../models/CartItem.js';
import ProductVariant from '../models/ProductVariant.js';

export async function createOrderFromCart(cartId: number, userId: number) {
  // Placeholder for order creation logic
  return { message: 'Order creation not implemented' };
}
`;

  await fs.writeFile(path.join(servicesDir, "order.service.ts"), orderService);
}

async function updateEcommerceDependencies(projectDir) {
  const packageJsonPath = path.join(projectDir, "package.json");
  const packageJson = await fs.readJson(packageJsonPath);

  // Add Stripe for payments
  packageJson.dependencies.stripe = "^14.0.0";

  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
}

module.exports = { generateEcommerceTemplate };
