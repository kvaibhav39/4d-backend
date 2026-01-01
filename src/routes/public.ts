import { Router } from "express";
import { PublicController } from "../controllers/public.controller";

const router = Router();
const publicController = new PublicController();

// Public routes - no authentication required
router.get("/org", (req, res) => publicController.getOrg(req, res));
router.get("/products", (req, res) => publicController.getProducts(req, res));
router.get("/categories", (req, res) =>
  publicController.getCategories(req, res)
);
router.get("/features", (req, res) => publicController.getFeatures(req, res));
router.post("/contact", (req, res) => publicController.submitContact(req, res));

export default router;
