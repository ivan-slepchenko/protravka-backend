import express from 'express';
import { AppDataSource, logger } from '../index';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        await AppDataSource.query(`
            TRUNCATE TABLE 
                "tkw_measurement",
                "product_execution",
                "order_execution",
                "product_recipe",
                "order_recipe",
                "product_detail",
                "order"
            CASCADE;
        `);

        logger.info('Cleanup completed successfully.');
        res.json({ message: 'Cleanup completed successfully.' });
    } catch (error) {
        logger.error('Failed to perform cleanup:', error);
        res.status(500).json({ error: 'Failed to perform cleanup' });
    }
});

export default router;
