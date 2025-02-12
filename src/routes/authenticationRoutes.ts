import express from 'express';
import { registerUser, loginUser, logoutUser, resetPassword } from '../controllers/firebaseAuth';
import { verifyToken } from '../middleware';
import { AppDataSource } from '../index';
import { Operator } from '../models/Operator';
import { logger } from '../index';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/reset-password', resetPassword);

router.get('/user', verifyToken, async (req, res) => {
    try {
        const user = req.user;
        const operator = await AppDataSource.getRepository(Operator).findOneBy({
            firebaseUserId: user.uid,
        });
        if (operator) {
            res.status(200).json({
                email: operator.email,
                name: operator.name,
                surname: operator.surname,
                phone: operator.phone,
                roles: operator.roles,
            });
        } else {
            res.status(404).json({ error: 'Operator not found' });
        }
    } catch (error) {
        logger.error('Failed to fetch user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

export default router;
