import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { Order } from './models/Order';
import "reflect-metadata"
import { Not } from 'typeorm';
import log4js from 'log4js';
import fs from 'fs';
import path from 'path';
import { version } from '../package.json';
import { Operator } from './models/Operator';
import { Crop } from './models/Crop';
import { Variety } from './models/Variety';
import { Product } from './models/Product';
import cookieParser from 'cookie-parser';
import { registerUser, loginUser, logoutUser, resetPassword } from './controllers/firebaseAuth';
import { verifyToken } from './middleware';
import { DataSource } from 'typeorm';
import { ProductDetail } from './models/ProductDetail';
import { User } from './models/User';

dotenv.config({ path: '.env' });

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

const corsOptions = {
    origin: 'http://localhost:3000', // Allow only this origin
    credentials: true, // Allow credentials
};
  
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser())

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.send(`Hello World! Version: ${version}`);
});
app.get('/api/orders', verifyToken, async (req, res) => {
  try {
    const orders = await AppDataSource.getRepository(Order).find({ 
      where: { status: Not('archived') },
      relations: ['productDetails', 'productDetails.product', 'operator'] // Include ProductDetails and Product relationships
    });
    res.json(orders);
  } catch (error) {
    logger.error('Failed to fetch orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.get('/api/orders/archived', verifyToken, async (req, res) => {
  try {
    const archivedOrders = await AppDataSource.getRepository(Order).find({ 
      where: { status: 'archived' },
      relations: ['productDetails', 'productDetails.product', 'operator'] // Include ProductDetails and Product relationships
    });
    res.json(archivedOrders);
  } catch (error) {
    logger.error('Failed to fetch archived orders:', error);
    res.status(500).json({ error: 'Failed to fetch archived orders' });
  }
});

app.post('/api/orders', verifyToken, async (req, res) => {
  try {
    const { productDetails, operatorId, cropId, varietyId, ...orderData } = req.body;

    const operator = await AppDataSource.getRepository(Operator).findOneBy({ id: operatorId });
    const crop = await AppDataSource.getRepository(Crop).findOneBy({ id: cropId });
    const variety = await AppDataSource.getRepository(Variety).findOneBy({ id: varietyId });

    if (!operator || !crop || !variety) {
      res.status(400).json({ error: 'Invalid operator, crop, or variety ID' , message: 'Invalid operator, crop, or variety ID' });
    } else {
      const productDetailsWithProduct = await Promise.all(productDetails.map(async (detail: any) => {
        const product = await AppDataSource.getRepository(Product).findOneBy({ id: detail.productId });
        if (!product) {
          throw new Error(`Invalid product ID: ${detail.productId}`);
        }
        return { ...detail, product };
      }));

      const orders = AppDataSource.getRepository(Order).create({
        ...orderData,
        operator,
        crop,
        variety,
        productDetails: productDetailsWithProduct
      });
  
      logger.debug('Order Data:', orders);
  
      const savedOrders = await AppDataSource.getRepository(Order).save(orders);
  
      logger.debug('Saved Order:', savedOrders);
  
      res.status(201).json(savedOrders); 
    }
  } catch (error) {
    logger.error('Failed to create order:', error);
    res.status(500).json({ error: 'Failed to create order', message: error });
  }
});

app.put('/api/orders/:id/status', verifyToken, async (req, res) => {
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
    logger.error('Failed to update order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

app.delete('/api/orders/:id', verifyToken, async (req, res) => {
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
    logger.error('Failed to delete order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

app.get('/api/operators', verifyToken, async (req, res) => {
  try {
    const operators = await AppDataSource.getRepository(Operator).find();
    res.json(operators);
  } catch (error) {
    logger.error('Failed to fetch operators:', error);
    res.status(500).json({ error: 'Failed to fetch operators' });
  }
});

app.post('/api/operators', verifyToken, async (req, res) => {
  try {
    const operator = AppDataSource.getRepository(Operator).create(req.body);
    const savedOperator = await AppDataSource.getRepository(Operator).save(operator);
    res.status(201).json(savedOperator);
  } catch (error) {
    logger.error('Failed to create operator:', error);
    res.status(500).json({ error: 'Failed to create operator' });
  }
});

app.put('/api/operators/:id', verifyToken, async (req, res) => {
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
    logger.error('Failed to update operator:', error);
    res.status(500).json({ error: 'Failed to update operator' });
  }
});

app.delete('/api/operators/:id', verifyToken, async (req, res) => {
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
    logger.error('Failed to delete operator:', error);
    res.status(500).json({ error: 'Failed to delete operator' });
  }
});

app.get('/api/crops', verifyToken, async (req, res) => {
  try {
    const crops = await AppDataSource.getRepository(Crop).find({ relations: ['varieties'] });
    res.json(crops);
  } catch (error) {
    logger.error('Failed to fetch crops:', error);
    res.status(500).json({ error: 'Failed to fetch crops' });
  }
});

app.post('/api/crops', verifyToken, async (req, res) => {
  try {
    const crop = AppDataSource.getRepository(Crop).create(req.body);
    const savedCrop = await AppDataSource.getRepository(Crop).save(crop);
    res.status(201).json(savedCrop);
  } catch (error) {
    logger.error('Failed to create crop:', error);
    res.status(500).json({ error: 'Failed to create crop' });
  }
});

app.post('/api/crops/:cropId/varieties', verifyToken, async (req, res) => {
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
    logger.error('Failed to create variety:', error);
    res.status(500).json({ error: 'Failed to create variety' });
  }
});

app.delete('/api/crops/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const crop = await AppDataSource.getRepository(Crop).findOne({ where: { id }, relations: ['varieties'] });
    if (crop) {
      await AppDataSource.getRepository(Crop).remove(crop);
      res.json({ message: 'Crop and its varieties deleted successfully' });
    } else {
      res.status(404).json({ error: 'Crop not found' });
    }
  } catch (error) {
    logger.error('Failed to delete crop and its varieties:', error);
    res.status(500).json({ error: 'Failed to delete crop and its varieties' });
  }
});

app.delete('/api/crops/:cropId/varieties/:varietyId', verifyToken, async (req, res) => {
  try {
    const { cropId, varietyId } = req.params;
    const variety = await AppDataSource.getRepository(Variety).findOneBy({ id: varietyId, crop: { id: cropId } });
    if (variety) {
      await AppDataSource.getRepository(Variety).remove(variety);
      res.json({ message: 'Variety deleted successfully' });
    } else {
      res.status(404).json({ error: 'Variety not found' });
    }
  } catch (error) {
    logger.error('Failed to delete variety:', error);
    res.status(500).json({ error: 'Failed to delete variety' });
  }
});

app.get('/api/products', verifyToken, async (req, res) => {
  try {
    const products = await AppDataSource.getRepository(Product).find();
    res.json(products);
  } catch (error) {
    logger.error('Failed to fetch products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/products', verifyToken, async (req, res) => {
  try {
    const product = AppDataSource.getRepository(Product).create(req.body);
    const savedProduct = await AppDataSource.getRepository(Product).save(product);
    res.status(201).json(savedProduct);
  } catch (error) {
    logger.error('Failed to create product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.delete('/api/products/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await AppDataSource.getRepository(Product).findOneBy({ id });
    if (product) {
      await AppDataSource.getRepository(Product).remove(product);
      res.json({ message: 'Product deleted successfully' });
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    logger.error('Failed to delete product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
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

app.post('/api/register', registerUser);
app.post('/api/login', loginUser);
app.post('/api/logout', logoutUser);
app.post('/api/reset-password', resetPassword);
app.get('/api/user', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    res.status(200).json(user);
  } catch (error) {
    logger.error('Failed to fetch user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
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