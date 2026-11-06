import express from "express";
import authController from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post('/register', authController.userRegisterController)
router.post('/login', authController.userLoginController)
router.get('/me', authMiddleware.authMiddleware, authController.currentUserController)


export default router;
