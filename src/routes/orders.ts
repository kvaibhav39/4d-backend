import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  validate,
  validateQuery,
  validateParams,
} from "../middleware/validate";
import {
  createOrderSchema,
  updateOrderSchema,
  addBookingToOrderSchema,
  cancelOrderSchema,
  getOrderParamsSchema,
  listOrdersQuerySchema,
} from "../validators/order.validator";
import { OrderController } from "../controllers/order.controller";

const router = Router();
const orderController = new OrderController();

router.use(authMiddleware);

router.get("/", validateQuery(listOrdersQuerySchema), (req, res) =>
  orderController.listOrders(req, res)
);

router.post("/", validate(createOrderSchema), (req, res) =>
  orderController.createOrder(req, res)
);

router.get("/:id", validateParams(getOrderParamsSchema), (req, res) =>
  orderController.getOrder(req, res)
);

router.put(
  "/:id",
  validateParams(getOrderParamsSchema),
  validate(updateOrderSchema),
  (req, res) => orderController.updateOrder(req, res)
);

router.post(
  "/:id/bookings",
  validateParams(getOrderParamsSchema),
  validate(addBookingToOrderSchema),
  (req, res) => orderController.addBooking(req, res)
);

router.get(
  "/:id/preview-cancellation-refund",
  validateParams(getOrderParamsSchema),
  (req, res) => orderController.previewCancellationRefund(req, res)
);

router.post(
  "/:id/cancel",
  validateParams(getOrderParamsSchema),
  validate(cancelOrderSchema),
  (req, res) => orderController.cancelOrder(req, res)
);

router.get("/:id/invoice", validateParams(getOrderParamsSchema), (req, res) =>
  orderController.generateInvoice(req, res)
);

export default router;
