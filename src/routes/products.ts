import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { validate, validateQuery, validateParams } from "../middleware/validate";
import {
  createProductSchema,
  updateProductSchema,
  getProductParamsSchema,
  listProductsQuerySchema,
} from "../validators/product.validator";
import { ProductController } from "../controllers/product.controller";

const router = Router();
const productController = new ProductController();

router.use(authMiddleware);

router.get(
  "/",
  validateQuery(listProductsQuerySchema),
  (req, res) => productController.listProducts(req, res)
);

router.get(
  "/:id",
  validateParams(getProductParamsSchema),
  (req, res) => productController.getProduct(req, res)
);

router.post(
  "/",
  validate(createProductSchema),
  (req, res) => productController.createProduct(req, res)
);

router.put(
  "/:id",
  validateParams(getProductParamsSchema),
  validate(updateProductSchema),
  (req, res) => productController.updateProduct(req, res)
);

router.delete(
  "/:id",
  validateParams(getProductParamsSchema),
  (req, res) => productController.deleteProduct(req, res)
);

export default router;


