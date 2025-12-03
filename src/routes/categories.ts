import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  validate,
  validateQuery,
  validateParams,
} from "../middleware/validate";
import {
  createCategorySchema,
  updateCategorySchema,
  getCategoryParamsSchema,
  listCategoriesQuerySchema,
} from "../validators/category.validator";
import { CategoryController } from "../controllers/category.controller";

const router = Router();
const categoryController = new CategoryController();

router.use(authMiddleware);

router.get("/", validateQuery(listCategoriesQuerySchema), (req, res) =>
  categoryController.listCategories(req, res)
);

router.get("/:id", validateParams(getCategoryParamsSchema), (req, res) =>
  categoryController.getCategory(req, res)
);

router.post("/", validate(createCategorySchema), (req, res) =>
  categoryController.createCategory(req, res)
);

router.put(
  "/:id",
  validateParams(getCategoryParamsSchema),
  validate(updateCategorySchema),
  (req, res) => categoryController.updateCategory(req, res)
);

router.delete("/:id", validateParams(getCategoryParamsSchema), (req, res) =>
  categoryController.deleteCategory(req, res)
);

router.post("/:id/restore", validateParams(getCategoryParamsSchema), (req, res) =>
  categoryController.restoreCategory(req, res)
);

export default router;
