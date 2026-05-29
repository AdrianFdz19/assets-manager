import { NextFunction, Request, Response, Router } from 'express'
import { pool } from '../config/databaseConfig';

export const users = Router();

users.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = `SELECT id, username as name, email, role, avatar FROM users`;
        const response = await pool.query(query);
        const data = response.rows;

        res.status(200)
            .json({
                message: '',
                data
            });
    } catch (err) {
        next(err);
    }
});

