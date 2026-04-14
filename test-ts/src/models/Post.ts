import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

interface PostAttributes {
  id: number;
  title: string;
  content?: string;
  userId: number;
}

interface PostCreationAttributes {
  title: string;
  content?: string;
  userId: number;
}

class Post extends Model<PostAttributes, PostCreationAttributes> {
  public id!: number;
  public title!: string;
  public content!: string;
  public userId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Post.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 200]
      }
    },
    content: {
      type: DataTypes.TEXT
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'Posts',
    timestamps: true
  }
);

export default Post;