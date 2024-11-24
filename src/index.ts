import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { AppDataSource } from './database';
import { Order } from './models/Order';
import "reflect-metadata"
import { Not } from 'typeorm';
import log4js from 'log4js';
import fs from 'fs';
import path from 'path';
import { version } from '../package.json';
import { ProductDetail } from './models/ProductDetail';

dotenv.config({ path: '.env' });

log4js.configure({
  appenders: {
    file: { type: 'dateFile', filename: 'logs/app.log', pattern: '.yyyy-MM-dd', compress: true },
    console: { type: 'console' }
  },
  categories: { default: { appenders: ['file', 'console'], level: 'info' } }
});

export const logger = log4js.getLogger();
logger.level = 'debug';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // Enable CORS for all routes
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.send(`Hello World! Version: ${version}`);
});
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await AppDataSource.getRepository(Order).find({ 
      where: { status: Not('archived') },
      relations: ['productDetails'] // Include ProductDetails relationship
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.get('/api/orders/archived', async (req, res) => {
  try {
    const archivedOrders = await AppDataSource.getRepository(Order).find({ 
      where: { status: 'archived' },
      relations: ['productDetails'] // Include ProductDetails relationship
    });
    res.json(archivedOrders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch archived orders' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { productDetails, ...orderData } = req.body;
    const orders = AppDataSource.getRepository(Order).create({
      ...orderData,
      productDetails
    });

    logger.debug('Order Data:', orders);

    const savedOrders = await AppDataSource.getRepository(Order).save(orders);

    logger.debug('Saved Order:', savedOrders);

    res.status(201).json(savedOrders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order', message: error });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const order = await AppDataSource.getRepository(Order).findOneBy({ id });
    if (order) {
      order.status = status;
      await AppDataSource.getRepository(Order).save(order);
      res.json(order);
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const order = await AppDataSource.getRepository(Order).findOneBy({ id });
    if (order) {
      await AppDataSource.getRepository(Order).remove(order);
      res.json({ message: 'Order deleted successfully' });
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

app.get('/api/logs', (req, res) => {
  const logFilePath = path.join(__dirname, '../logs/app.log');
  fs.readFile(logFilePath, 'utf8', (err, data) => {
    if (err) {
      logger.error('Failed to read log file:', err);
      return res.status(500).json({ error: 'Failed to read log file' });
    }
    res.type('text/plain').send(data);
  });
});

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
  logger.debug(`DB_HOST: ${process.env.DB_HOST}`);
  logger.debug(`DB_PORT: ${process.env.DB_PORT}`);
  logger.debug(`DB_USERNAME: ${process.env.DB_USERNAME}`);
  logger.debug(`DB_PASSWORD: ${process.env.DB_PASSWORD}`);
  logger.debug(`DB_NAME: ${process.env.DB_NAME}`);

  AppDataSource.initialize()
    .then(() => logger.info('Database connected'))
    .catch((err: any) => logger.error('Unable to connect to the database:', err));
});