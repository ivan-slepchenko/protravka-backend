
import express from 'express';
import dotenv from 'dotenv';
import { AppDataSource } from './database';
import { Order } from './models/Order';
import { ProductDetail } from './models/ProductDetail';
import "reflect-metadata"

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/api/orders', async (req, res) => {
  try {
    const orders = await AppDataSource.getRepository(Order).find({ where: { status: 'active' } });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.get('/api/orders/archived', async (req, res) => {
  try {
    const archivedOrders = await AppDataSource.getRepository(Order).find({ where: { status: 'archived' } });
    res.json(archivedOrders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch archived orders' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const order = await AppDataSource.getRepository(Order).save(req.body);
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  AppDataSource.initialize()
    .then(() => console.log('Database connected'))
    .catch((err: any) => console.error('Unable to connect to the database:', err));
});