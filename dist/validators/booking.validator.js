"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBookingsQuerySchema = exports.getBookingParamsSchema = exports.addPaymentSchema = exports.cancelBookingSchema = exports.returnProductSchema = exports.issueProductSchema = exports.updateBookingSchema = exports.checkConflictsSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const objectIdPattern = /^[0-9a-fA-F]{24}$/;
exports.checkConflictsSchema = joi_1.default.object({
    productId: joi_1.default.string().pattern(objectIdPattern).required().messages({
        "string.pattern.base": "Invalid product ID format",
        "any.required": "Product ID is required",
    }),
    fromDateTime: joi_1.default.date().iso().required().messages({
        "date.base": "From date time must be a valid date",
        "date.format": "From date time must be in ISO format",
        "any.required": "From date time is required",
    }),
    toDateTime: joi_1.default.date()
        .iso()
        .greater(joi_1.default.ref("fromDateTime"))
        .required()
        .messages({
        "date.base": "To date time must be a valid date",
        "date.format": "To date time must be in ISO format",
        "date.greater": "To date time must be after from date time",
        "any.required": "To date time is required",
    }),
    excludeBookingId: joi_1.default.string().pattern(objectIdPattern).optional().messages({
        "string.pattern.base": "Invalid booking ID format",
    }),
});
exports.updateBookingSchema = joi_1.default.object({
    productId: joi_1.default.string().pattern(objectIdPattern).optional().messages({
        "string.pattern.base": "Invalid product ID format",
    }),
    categoryId: joi_1.default.string()
        .pattern(objectIdPattern)
        .allow("", null)
        .optional()
        .messages({
        "string.pattern.base": "Invalid category ID format",
    }),
    // Customer info is in order, not booking - removed customerName and customerPhone
    fromDateTime: joi_1.default.date().iso().optional().messages({
        "date.base": "From date time must be a valid date",
        "date.format": "From date time must be in ISO format",
    }),
    toDateTime: joi_1.default.date().iso().optional().messages({
        "date.base": "To date time must be a valid date",
        "date.format": "To date time must be in ISO format",
    }),
    decidedRent: joi_1.default.number().min(0).optional().messages({
        "number.base": "Decided rent must be a number",
        "number.min": "Decided rent must be 0 or greater",
    }),
    advanceAmount: joi_1.default.number().min(0).optional().messages({
        "number.base": "Advance amount must be a number",
        "number.min": "Advance amount must be 0 or greater",
    }),
    additionalItemsDescription: joi_1.default.string()
        .trim()
        .max(1000)
        .allow("", null)
        .optional()
        .messages({
        "string.max": "Additional items description must not exceed 1000 characters",
    }),
    overrideConflicts: joi_1.default.boolean().optional(),
}).custom((value, helpers) => {
    if (value.fromDateTime && value.toDateTime) {
        if (new Date(value.toDateTime) <= new Date(value.fromDateTime)) {
            return helpers.error("date.greater");
        }
    }
    return value;
}, "Date validation");
exports.issueProductSchema = joi_1.default.object({
    paymentAmount: joi_1.default.number().min(0).optional().messages({
        "number.min": "Payment amount must be positive or zero",
    }),
    paymentNote: joi_1.default.string()
        .trim()
        .max(500)
        .optional()
        .allow("", null)
        .messages({
        "string.max": "Payment note must not exceed 500 characters",
    }),
});
exports.returnProductSchema = joi_1.default.object({
    paymentAmount: joi_1.default.number().min(0).optional().messages({
        "number.min": "Payment amount must be positive or zero",
    }),
    paymentNote: joi_1.default.string()
        .trim()
        .max(500)
        .optional()
        .allow("", null)
        .messages({
        "string.max": "Payment note must not exceed 500 characters",
    }),
});
exports.cancelBookingSchema = joi_1.default.object({
    shouldTransfer: joi_1.default.boolean().optional(),
    transfers: joi_1.default.array()
        .items(joi_1.default.object({
        bookingId: joi_1.default.string().pattern(objectIdPattern).required().messages({
            "string.pattern.base": "Invalid booking ID format",
            "any.required": "Booking ID is required",
        }),
        amount: joi_1.default.number().min(0.01).required().messages({
            "number.base": "Transfer amount must be a number",
            "number.min": "Transfer amount must be greater than 0",
            "any.required": "Transfer amount is required",
        }),
    }))
        .optional(),
    shouldRefund: joi_1.default.boolean().optional(),
    refundAmount: joi_1.default.number().min(0).optional().messages({
        "number.min": "Refund amount must be positive or zero",
    }),
}).custom((value, helpers) => {
    // If shouldTransfer is true, transfers array must be provided and not empty
    if (value.shouldTransfer === true) {
        if (!value.transfers || value.transfers.length === 0) {
            return helpers.error("any.custom", {
                message: "Transfers array is required when shouldTransfer is true",
            });
        }
    }
    return value;
}, "Transfer validation");
exports.addPaymentSchema = joi_1.default.object({
    type: joi_1.default.string()
        .valid("ADVANCE", "PAYMENT_RECEIVED", "REFUND")
        .required()
        .messages({
        "any.only": "Payment type must be one of: ADVANCE, PAYMENT_RECEIVED, REFUND",
        "any.required": "Payment type is required",
    }),
    amount: joi_1.default.number().min(0).required().messages({
        "number.base": "Amount must be a number",
        "number.min": "Amount must be 0 or greater",
        "any.required": "Amount is required",
    }),
    note: joi_1.default.string().trim().max(500).allow("", null).optional().messages({
        "string.max": "Note must not exceed 500 characters",
    }),
});
exports.getBookingParamsSchema = joi_1.default.object({
    id: joi_1.default.string().pattern(objectIdPattern).required().messages({
        "string.pattern.base": "Invalid booking ID format",
        "any.required": "Booking ID is required",
    }),
});
exports.listBookingsQuerySchema = joi_1.default.object({
    status: joi_1.default.string()
        .valid("BOOKED", "ISSUED", "RETURNED", "CANCELLED")
        .optional()
        .messages({
        "any.only": "Status must be one of: BOOKED, ISSUED, RETURNED, CANCELLED",
    }),
    startDate: joi_1.default.date().iso().optional().messages({
        "date.base": "Start date must be a valid date",
        "date.format": "Start date must be in ISO format",
    }),
    endDate: joi_1.default.date().iso().optional().messages({
        "date.base": "End date must be a valid date",
        "date.format": "End date must be in ISO format",
    }),
    productId: joi_1.default.string().pattern(objectIdPattern).optional().messages({
        "string.pattern.base": "Invalid product ID format",
    }),
    search: joi_1.default.string().trim().max(200).optional().allow("").messages({
        "string.max": "Search query must not exceed 200 characters",
    }),
});
