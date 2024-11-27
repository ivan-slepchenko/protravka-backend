import { NextFunction } from "express";
import { adminApp } from "./config/firebase";
import { Request, Response } from "express";


export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    const idToken = req.cookies.access_token;
    if (!idToken) {
        return res.status(403).json({ error: 'No token provided' });
    }

    try {
      const decodedToken = await adminApp.auth().verifyIdToken(idToken); 
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(403).json({ error: 'Unauthorized' });
    }
};