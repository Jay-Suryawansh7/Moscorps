import { Model, DataTypes } from 'sequelize';
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
