import { Router } from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';

const transactionRoutes = Router();

transactionRoutes.post('/', authMiddleware.authMiddleware, createTransaction);


export default transactionRoutes;