import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  validate,
  validateQuery,
  validateParams,
} from "../middleware/validate";
import {
  checkConflictsSchema,
  createBookingSchema,
  updateBookingSchema,
  addPaymentSchema,
  getBookingParamsSchema,
  listBookingsQuerySchema,
  issueProductSchema,
  returnProductSchema,
  cancelBookingSchema,
} from "../validators/booking.validator";
import { BookingController } from "../controllers/booking.controller";

const router = Router();
const bookingController = new BookingController();

router.use(authMiddleware);

// Specific routes must come before parameterized routes
router.post("/check-conflicts", validate(checkConflictsSchema), (req, res) =>
  bookingController.checkConflicts(req, res)
);

router.get("/", validateQuery(listBookingsQuerySchema), (req, res) =>
  bookingController.listBookings(req, res)
);

router.post("/", validate(createBookingSchema), (req, res) =>
  bookingController.createBooking(req, res)
);

router.get("/:id", validateParams(getBookingParamsSchema), (req, res) =>
  bookingController.getBooking(req, res)
);

router.put(
  "/:id",
  validateParams(getBookingParamsSchema),
  validate(updateBookingSchema),
  (req, res) => bookingController.updateBooking(req, res)
);

router.post(
  "/:id/issue",
  validateParams(getBookingParamsSchema),
  validate(issueProductSchema),
  (req, res) => bookingController.issueProduct(req, res)
);

router.post(
  "/:id/return",
  validateParams(getBookingParamsSchema),
  validate(returnProductSchema),
  (req, res) => bookingController.returnProduct(req, res)
);

router.post(
  "/:id/cancel",
  validateParams(getBookingParamsSchema),
  validate(cancelBookingSchema),
  (req, res) => bookingController.cancelBooking(req, res)
);

router.post(
  "/:id/payments",
  validateParams(getBookingParamsSchema),
  validate(addPaymentSchema),
  (req, res) => bookingController.addPayment(req, res)
);

router.get(
  "/:id/preview-cancellation-refund",
  validateParams(getBookingParamsSchema),
  (req, res) => bookingController.previewCancellationRefund(req, res)
);

export default router;
