import { Router } from "express";
import authController from "../controllers/auth.controller";
const authRouter = Router();
authRouter.post("/login", authController.Login);
authRouter.post("/register", authController.Register);
authRouter.post("/refresh-token", authController.RefreshToken);
export { authRouter };
