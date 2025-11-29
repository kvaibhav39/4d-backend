import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { loginSchema } from "../validators/auth.validator";
import { AuthController } from "../controllers/auth.controller";

const router = Router();
const authController = new AuthController();

router.post("/login", validate(loginSchema), (req, res) =>
  authController.login(req, res)
);
router.get("/me", authMiddleware, (req, res) =>
  authController.getCurrentUser(req, res)
);

export default router;
