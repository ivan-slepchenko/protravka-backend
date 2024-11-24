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
import { Operator } from './models/Operator';
import { Crop } from './models/Crop';
import { Variety } from './models/Variety';

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
      relations: ['productDetails', 'operator'] // Include ProductDetails and Operator relationships
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
      relations: ['productDetails', 'operator'] // Include ProductDetails relationship
    });
    res.json(archivedOrders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch archived orders' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { productDetails, operator, crop, variety, ...orderData } = req.body;
    
    const orders = AppDataSource.getRepository(Order).create({
      ...orderData,
      operator,
      crop,
      variety,
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

app.get('/api/operators', async (req, res) => {
  try {
    const operators = await AppDataSource.getRepository(Operator).find();
    res.json(operators);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch operators' });
  }
});

app.post('/api/operators', async (req, res) => {
  try {
    const operator = AppDataSource.getRepository(Operator).create(req.body);
    const savedOperator = await AppDataSource.getRepository(Operator).save(operator);
    res.status(201).json(savedOperator);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create operator' });
  }
});

app.put('/api/operators/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const operator = await AppDataSource.getRepository(Operator).findOneBy({ id });
    if (operator) {
      AppDataSource.getRepository(Operator).merge(operator, req.body);
      const updatedOperator = await AppDataSource.getRepository(Operator).save(operator);
      res.json(updatedOperator);
    } else {
      res.status(404).json({ error: 'Operator not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update operator' });
  }
});

app.delete('/api/operators/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const operator = await AppDataSource.getRepository(Operator).findOneBy({ id });
    if (operator) {
      await AppDataSource.getRepository(Operator).remove(operator);
      res.json({ message: 'Operator deleted successfully' });
    } else {
      res.status(404).json({ error: 'Operator not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete operator' });
  }
});

app.get('/api/crops', async (req, res) => {
  try {
    const crops = await AppDataSource.getRepository(Crop).find({ relations: ['varieties'] });
    res.json(crops);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch crops' });
  }
});

app.post('/api/crops', async (req, res) => {
  try {
    const crop = AppDataSource.getRepository(Crop).create(req.body);
    const savedCrop = await AppDataSource.getRepository(Crop).save(crop);
    res.status(201).json(savedCrop);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create crop' });
  }
});

app.post('/api/crops/:cropId/varieties', async (req, res) => {
  try {
    const { cropId } = req.params;
    const crop = await AppDataSource.getRepository(Crop).findOneBy({ id: cropId });
    if (crop) {
      const variety = AppDataSource.getRepository(Variety).create({ ...req.body, crop });
      const savedVariety = await AppDataSource.getRepository(Variety).save(variety);
      res.status(201).json(savedVariety);
    } else {
      res.status(404).json({ error: 'Crop not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create variety' });
  }
});

app.delete('/api/crops/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const crop = await AppDataSource.getRepository(Crop).findOneBy({ id });
    if (crop) {
      await AppDataSource.getRepository(Crop).remove(crop);
      res.json({ message: 'Crop deleted successfully' });
    } else {
      res.status(404).json({ error: 'Crop not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete crop' });
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