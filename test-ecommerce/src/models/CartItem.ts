import { Model, DataTypes } from 'sequelize';
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
