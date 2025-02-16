import express from 'express';
import { registerUser, loginUser, logoutUser, resetPassword } from '../controllers/firebaseAuth';
import { verifyToken } from '../middleware';
import { Operator } from '../models/Operator';
import { AppDataSource, logger } from '../index';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/reset-password', resetPassword);

router.get('/user', verifyToken, async (req, res) => {
    try {
        const user = req.user;
        const operator = await AppDataSource.getRepository(Operator).findOne({
            where: {
                firebaseUserId: user.uid,
            },
            relations: ['company'],
        });

        if (operator) {
            try {
                operator.company.featureFlags = JSON.parse(operator.company.featureFlags);
            } catch (e) {
                logger.warn('Failed to parse featureFlags:', e);
            }
        }

        if (operator) {
            res.status(200).json(operator);
        } else {
            res.status(404).json({ error: 'Operator not found' });
        }
    } catch (error) {
        logger.error('Failed to fetch user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

export default router;
