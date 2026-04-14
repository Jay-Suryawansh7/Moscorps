import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DB_STORAGE || './database.sqlite',
  logging: false
});

sequelize.authenticate()
  .then(() => console.log('✅ SQLite connected'))
  .catch((err: Error) => {
    console.error('❌ SQLite connection error:', err);
    process.exit(1);
  });

export default sequelize;