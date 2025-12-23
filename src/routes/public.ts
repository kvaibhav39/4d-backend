import { Router } from "express";
import { PublicController } from "../controllers/public.controller";

const router = Router();
const publicController = new PublicController();

// Public routes - no authentication required
router.get("/features", (req, res) => publicController.getFeatures(req, res));
router.post("/contact", (req, res) => publicController.submitContact(req, res));

export default router;
