import { Model, DataTypes } from 'sequelize';
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
