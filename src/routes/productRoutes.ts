import express from 'express';
import { verifyToken } from '../middleware';
import { AppDataSource } from '../index';
import { Product } from '../models/Product';
import { logger } from '../index';

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
    try {
        const products = await AppDataSource.getRepository(Product).find();
        res.json(products);
    } catch (error) {
        logger.error('Failed to fetch products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

router.post('/', verifyToken, async (req, res) => {
    try {
        const { name, density, activeIngredient } = req.body;
        if (!name || !density) {
            res.status(400).json({ error: 'Name and density are required' });
        } else {
            const product = AppDataSource.getRepository(Product).create({
                name,
                density,
                activeIngredient,
            });
            const savedProduct = await AppDataSource.getRepository(Product).save(product);
            res.status(201).json(savedProduct);
        }
    } catch (error) {
        logger.error('Failed to create product:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

router.delete('/:id', verifyToken, async (req, res) => {
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

export default router;
