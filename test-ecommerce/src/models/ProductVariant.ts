import { Model, DataTypes } from 'sequelize';
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
