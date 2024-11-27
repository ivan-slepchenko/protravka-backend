import { DataSource } from 'typeorm';
import { Order } from './models/Order';
import { ProductDetail } from './models/ProductDetail';
import log4js from 'log4js';
import { Operator } from './models/Operator';
import { Crop } from './models/Crop';
import { Variety } from './models/Variety';
import { Product } from './models/Product';
import { User } from './models/User';



export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT!),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  migrations: ['dist/migrations/*.js'],
  migrationsTableName: 'migrations',
  entities: [Order, ProductDetail, Operator, Crop, Variety, Product, User], // Add User entity
  synchronize: true,
});