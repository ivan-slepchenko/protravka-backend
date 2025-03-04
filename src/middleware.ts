import { NextFunction, Request, Response } from 'express';
import { firebaseAdminApp } from './config/firebase';

declare module 'express-serve-static-core' {
    interface Request {
        user?: any;
    }
}

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    const idToken = req.cookies.access_token;
    if (!idToken) {
        res.status(403).json({ error: 'No token provided' });
    } else {
        try {
            const decodedToken = await firebaseAdminApp.auth().verifyIdToken(idToken);
            req.user = decodedToken;
            next();
        } catch (error) {
            console.error('Error verifying token:', error);
            res.status(403).json({ error: 'Unauthorized' });
        }
    }
};
