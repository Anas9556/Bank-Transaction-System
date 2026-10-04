import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.routes.js';
import accountRouter from './routes/account.routes.js';
import transactionRoutes from './routes/transaction.routes.js';

const app = express();
app.use(express.json());
app.use(cookieParser());


app.use('/api/auth', authRouter);
app.use('/api/accounts', accountRouter);
app.use('/api/transactions', transactionRoutes);


export default app;