import express from 'express';
import { verifyToken } from '../middleware';
import { Crop } from '../models/Crop';
import { Variety } from '../models/Variety';
import { AppDataSource, logger } from '../index';
import { Operator } from '../models/Operator';

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
    try {
        const user = req.user;
        const operator = await AppDataSource.getRepository(Operator).findOne({
            where: { firebaseUserId: user.uid },
            relations: ['company', 'company.crops', 'company.crops.varieties'],
        });

        if (!operator || !operator.company) {
            res.status(404).json({ error: 'Operator or company not found' });
            return;
        }

        const crops = await AppDataSource.getRepository(Crop).find({
            where: { company: { id: operator.company.id } },
            relations: ['varieties'],
        });
        res.json(crops);
    } catch (error) {
        logger.error('Failed to fetch crops:', error);
        res.status(500).json({ error: 'Failed to fetch crops' });
    }
});

router.post('/', verifyToken, async (req, res) => {
    try {
        const user = req.user;
        const operator = await AppDataSource.getRepository(Operator)
            .createQueryBuilder('op')
            .leftJoinAndSelect('op.company', 'company')
            .where('op.firebaseUserId = :uid', { uid: user.uid })
            .getOne();

        if (!operator || !operator.company) {
            res.status(404).json({ error: 'Operator or company not found' });
            return;
        }

        const crop = AppDataSource.getRepository(Crop).create({
            ...req.body,
            company: operator.company,
        });
        const savedCrop = await AppDataSource.getRepository(Crop).save(crop);
        res.status(201).json(savedCrop);
    } catch (error) {
        logger.error('Failed to create crop:', error);
        res.status(500).json({ error: 'Failed to create crop' });
    }
});

router.post('/:cropId/varieties', verifyToken, async (req, res) => {
    try {
        const user = req.user;
        const operator = await AppDataSource.getRepository(Operator)
            .createQueryBuilder('op')
            .leftJoinAndSelect('op.company', 'company')
            .where('op.firebaseUserId = :uid', { uid: user.uid })
            .getOne();

        if (!operator || !operator.company) {
            res.status(404).json({ error: 'Operator or company not found' });
            return;
        }

        const { cropId } = req.params;
        const crop = await AppDataSource.getRepository(Crop).findOne({
            where: { id: cropId, company: { id: operator.company.id } },
        });

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

router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const crop = await AppDataSource.getRepository(Crop).findOne({
            where: { id },
            relations: ['varieties'],
        });
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

router.delete('/:cropId/varieties/:varietyId', verifyToken, async (req, res) => {
    try {
        const { cropId, varietyId } = req.params;
        const variety = await AppDataSource.getRepository(Variety).findOneBy({
            id: varietyId,
            crop: { id: cropId },
        });
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

export default router;
