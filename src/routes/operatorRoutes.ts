import express from 'express';
import { verifyToken } from '../middleware';
import { AppDataSource } from '../index';
import { Operator } from '../models/Operator';
import { logger } from '../index';

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
    try {
        const operators = await AppDataSource.getRepository(Operator).find();
        res.json(operators);
    } catch (error) {
        logger.error('Failed to fetch operators:', error);
        res.status(500).json({ error: 'Failed to fetch operators' });
    }
});

router.post('/', verifyToken, async (req, res) => {
    try {
        const operator = AppDataSource.getRepository(Operator).create(req.body);
        const savedOperator = await AppDataSource.getRepository(Operator).save(operator);
        res.status(201).json(savedOperator);
    } catch (error) {
        logger.error('Failed to create operator:', error);
        res.status(500).json({ error: 'Failed to create operator' });
    }
});

router.put('/:id', verifyToken, async (req, res) => {
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

router.delete('/:id', verifyToken, async (req, res) => {
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

export default router;
