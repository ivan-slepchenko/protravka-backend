import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { Order } from './models/Order';
import { ProductDetail } from './models/ProductDetail';
import log4js from 'log4js';

dotenv.config();

export const logger = log4js.getLogger();


logger.debug(`DB_HOST: ${process.env.DB_HOST}`);
logger.debug(`DB_PORT: ${process.env.DB_PORT}`);
logger.debug(`DB_USERNAME: ${process.env.DB_USERNAME}`);
logger.debug(`DB_PASSWORD: ${process.env.DB_PASSWORD}`);
logger.debug(`DB_NAME: ${process.env.DB_NAME}`);

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

AppDataSource.initialize()
  .then(() => {
    logger.info('Data Source has been initialized successfully.');
  })
  .catch((err) => {
    logger.error('Error during Data Source initialization:', err);
  });