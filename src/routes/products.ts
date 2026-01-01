import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  validate,
  validateQuery,
  validateParams,
} from "../middleware/validate";
import {
  createProductSchema,
  updateProductSchema,
  getProductParamsSchema,
  listProductsQuerySchema,
  getProductBookingsQuerySchema,
  bulkUpdateProductOrderSchema,
} from "../validators/product.validator";
import { ProductController } from "../controllers/product.controller";
import { upload } from "../middleware/upload";

const router = Router();
const productController = new ProductController();

router.use(authMiddleware);

router.get("/", validateQuery(listProductsQuerySchema), (req, res) =>
  productController.listProducts(req, res)
);

router.get("/:id", validateParams(getProductParamsSchema), (req, res) =>
  productController.getProduct(req, res)
);

router.post(
  "/",
  upload.single("image"),
  validate(createProductSchema),
  (req, res) => productController.createProduct(req, res)
);

router.put(
  "/:id",
  validateParams(getProductParamsSchema),
  upload.single("image"),
  validate(updateProductSchema),
  (req, res) => productController.updateProduct(req, res)
);

router.delete("/:id", validateParams(getProductParamsSchema), (req, res) =>
  productController.deleteProduct(req, res)
);

router.post(
  "/:id/restore",
  validateParams(getProductParamsSchema),
  (req, res) => productController.restoreProduct(req, res)
);

router.get(
  "/:id/bookings",
  validateParams(getProductParamsSchema),
  validateQuery(getProductBookingsQuerySchema),
  (req, res) => productController.getProductBookings(req, res)
);

router.post(
  "/bulk-update-order",
  validate(bulkUpdateProductOrderSchema),
  (req, res) => productController.bulkUpdateProductOrder(req, res)
);

export default router;
