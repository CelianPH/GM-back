import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    define: {
      underscored: true,
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  }
);

export async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connecté');
  } catch (err) {
    console.error('❌ Connexion MySQL échouée :', err);
    process.exit(1);
  }
}
