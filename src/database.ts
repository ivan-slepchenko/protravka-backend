import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { Order } from './models/Order';
import { ProductDetail } from './models/ProductDetail';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT!),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  migrations: ['dist/migrations/*.js'],
  migrationsTableName: 'migrations',
  entities: [Order, ProductDetail],
  synchronize: true,
});