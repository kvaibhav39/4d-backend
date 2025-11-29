"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const booking_validator_1 = require("../validators/booking.validator");
const booking_controller_1 = require("../controllers/booking.controller");
const router = (0, express_1.Router)();
const bookingController = new booking_controller_1.BookingController();
router.use(auth_1.authMiddleware);
// Specific routes must come before parameterized routes
router.post("/check-conflicts", (0, validate_1.validate)(booking_validator_1.checkConflictsSchema), (req, res) => bookingController.checkConflicts(req, res));
router.get("/", (0, validate_1.validateQuery)(booking_validator_1.listBookingsQuerySchema), (req, res) => bookingController.listBookings(req, res));
router.post("/", (0, validate_1.validate)(booking_validator_1.createBookingSchema), (req, res) => bookingController.createBooking(req, res));
router.get("/:id", (0, validate_1.validateParams)(booking_validator_1.getBookingParamsSchema), (req, res) => bookingController.getBooking(req, res));
router.put("/:id", (0, validate_1.validateParams)(booking_validator_1.getBookingParamsSchema), (0, validate_1.validate)(booking_validator_1.updateBookingSchema), (req, res) => bookingController.updateBooking(req, res));
router.patch("/:id/status", (0, validate_1.validateParams)(booking_validator_1.getBookingParamsSchema), (0, validate_1.validate)(booking_validator_1.updateBookingStatusSchema), (req, res) => bookingController.updateBookingStatus(req, res));
router.post("/:id/payments", (0, validate_1.validateParams)(booking_validator_1.getBookingParamsSchema), (0, validate_1.validate)(booking_validator_1.addPaymentSchema), (req, res) => bookingController.addPayment(req, res));
exports.default = router;
