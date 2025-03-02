import express from 'express';
import { verifyToken } from '../middleware';
import { Operator } from '../models/Operator';
import { AppDataSource, logger } from '../index';

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
    try {
        const user = req.user;
        const operator = await AppDataSource.getRepository(Operator).findOne({
            where: { firebaseUserId: user.uid },
            relations: ['company', 'company.operators'],
        });

        if (!operator || !operator.company) {
            res.status(404).json({ error: 'Operator or company not found' });
            return;
        }

        res.json(operator.company.operators);
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

router.put('/firebase-token', verifyToken, async (req, res) => {
    try {
        const user = req.user;
        const { firebaseToken } = req.body;

        logger.debug('Updating Firebase token:', firebaseToken);

        const operator = await AppDataSource.getRepository(Operator).findOne({
            where: { firebaseUserId: user.uid },
        });

        if (!operator) {
            res.status(404).json({ error: 'Operator not found' });
            return;
        }

        operator.firebaseToken = firebaseToken;
        await AppDataSource.getRepository(Operator).save(operator);

        res.json({ message: 'Firebase token updated successfully' });
    } catch (error) {
        logger.error('Failed to update Firebase token:', error);
        res.status(500).json({ error: 'Failed to update Firebase token' });
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
