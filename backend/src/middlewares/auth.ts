import config from '@/config/config';
import logger from '@/config/logger';
import { NextFunction, Request, Response } from 'express';

// Will check if auth token matched one in env
const auth = () => (req: Request, res: Response, next: NextFunction) => {
    // Get auth token from headers
    const token = req.headers.authorization;
    // Compare it with the one in env
    if (token === config.scraper.API_SECRET) {
        return next();
    } else {
        logger.error('Unauthorized', { headers: req.headers });
        return res.status(401).json({ success: 0, message: 'Unauthorized' });
    }
};

export default auth;
