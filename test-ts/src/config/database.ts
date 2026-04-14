import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'mydb',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    logging: false
  }
);

sequelize.authenticate()
  .then(() => console.log('✅ PostgreSQL connected'))
  .catch((err: Error) => {
    console.error('❌ PostgreSQL connection error:', err);
    process.exit(1);
  });

export default sequelize;