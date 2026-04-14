import { Model, DataTypes } from 'sequelize';
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
