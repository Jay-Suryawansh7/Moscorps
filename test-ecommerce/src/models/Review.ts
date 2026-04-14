import { Model, DataTypes } from 'sequelize';
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
