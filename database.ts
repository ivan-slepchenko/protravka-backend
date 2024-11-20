import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';
import { Order } from './models/Order';

dotenv.config();

export const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  models: [Order], // Add Order model
});