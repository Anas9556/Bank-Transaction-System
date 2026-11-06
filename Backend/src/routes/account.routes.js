import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import accountController from "../controllers/account.controller.js";

const router = express.Router();

router.get('/', authMiddleware.authMiddleware, accountController.listAccountsController );
router.post('/', authMiddleware.authMiddleware, accountController.createAccountController );
router.patch('/:accountId', authMiddleware.authMiddleware, accountController.renameAccountController );


export default router;
