"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listOrdersQuerySchema = exports.getOrderParamsSchema = exports.cancelOrderSchema = exports.collectPaymentSchema = exports.addBookingToOrderSchema = exports.updateOrderSchema = exports.createOrderSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const objectIdPattern = /^[0-9a-fA-F]{24}$/;
exports.createOrderSchema = joi_1.default.object({
    customerName: joi_1.default.string().trim().min(1).max(200).required().messages({
        "string.empty": "Customer name cannot be empty",
        "string.min": "Customer name must be at least 1 character",
        "string.max": "Customer name must not exceed 200 characters",
        "any.required": "Customer name is required",
    }),
    customerPhone: joi_1.default.string()
        .trim()
        .max(20)
        .allow("", null)
        .optional()
        .messages({
        "string.max": "Customer phone must not exceed 20 characters",
    }),
    bookings: joi_1.default.array()
        .items(joi_1.default.object({
        productId: joi_1.default.string().pattern(objectIdPattern).required().messages({
            "string.pattern.base": "Invalid product ID format",
            "any.required": "Product ID is required",
        }),
        categoryId: joi_1.default.string()
            .pattern(objectIdPattern)
            .allow("", null)
            .optional()
            .messages({
            "string.pattern.base": "Invalid category ID format",
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
        decidedRent: joi_1.default.number().min(0).required().messages({
            "number.base": "Decided rent must be a number",
            "number.min": "Decided rent must be 0 or greater",
            "any.required": "Decided rent is required",
        }),
        advanceAmount: joi_1.default.number().min(0).required().messages({
            "number.base": "Advance amount must be a number",
            "number.min": "Advance amount must be 0 or greater",
            "any.required": "Advance amount is required",
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
    }))
        .optional()
        .messages({
        "array.base": "Bookings must be an array",
    }),
});
exports.updateOrderSchema = joi_1.default.object({
    customerName: joi_1.default.string().trim().min(1).max(200).optional().messages({
        "string.empty": "Customer name cannot be empty",
        "string.min": "Customer name must be at least 1 character",
        "string.max": "Customer name must not exceed 200 characters",
    }),
    customerPhone: joi_1.default.string()
        .trim()
        .max(20)
        .allow("", null)
        .optional()
        .messages({
        "string.max": "Customer phone must not exceed 20 characters",
    }),
});
exports.addBookingToOrderSchema = joi_1.default.object({
    productId: joi_1.default.string().pattern(objectIdPattern).required().messages({
        "string.pattern.base": "Invalid product ID format",
        "any.required": "Product ID is required",
    }),
    categoryId: joi_1.default.string()
        .pattern(objectIdPattern)
        .allow("", null)
        .optional()
        .messages({
        "string.pattern.base": "Invalid category ID format",
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
    decidedRent: joi_1.default.number().min(0).required().messages({
        "number.base": "Decided rent must be a number",
        "number.min": "Decided rent must be 0 or greater",
        "any.required": "Decided rent is required",
    }),
    advanceAmount: joi_1.default.number().min(0).required().messages({
        "number.base": "Advance amount must be a number",
        "number.min": "Advance amount must be 0 or greater",
        "any.required": "Advance amount is required",
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
});
exports.collectPaymentSchema = joi_1.default.object({
    amount: joi_1.default.number().min(0.01).required().messages({
        "number.base": "Amount must be a number",
        "number.min": "Amount must be greater than 0",
        "any.required": "Amount is required",
    }),
    note: joi_1.default.string().trim().max(500).allow("", null).optional().messages({
        "string.max": "Note must not exceed 500 characters",
    }),
});
exports.cancelOrderSchema = joi_1.default.object({
    refundAmount: joi_1.default.number().min(0).optional().messages({
        "number.base": "Refund amount must be a number",
        "number.min": "Refund amount cannot be negative",
    }),
    refundNote: joi_1.default.string().trim().max(500).allow("", null).optional().messages({
        "string.max": "Refund note must not exceed 500 characters",
    }),
});
exports.getOrderParamsSchema = joi_1.default.object({
    id: joi_1.default.string().pattern(objectIdPattern).required().messages({
        "string.pattern.base": "Invalid order ID format",
        "any.required": "Order ID is required",
    }),
});
exports.listOrdersQuerySchema = joi_1.default.object({
    status: joi_1.default.string()
        .valid("INITIATED", "IN_PROGRESS", "PARTIALLY_DONE", "FULLY_DONE", "CANCELLED")
        .optional()
        .messages({
        "any.only": "Status must be one of: INITIATED, IN_PROGRESS, PARTIALLY_DONE, FULLY_DONE, CANCELLED",
    }),
    startDate: joi_1.default.date().iso().optional().messages({
        "date.base": "Start date must be a valid date",
        "date.format": "Start date must be in ISO format",
    }),
    endDate: joi_1.default.date().iso().optional().messages({
        "date.base": "End date must be a valid date",
        "date.format": "End date must be in ISO format",
    }),
    search: joi_1.default.string().trim().max(200).optional().allow("").messages({
        "string.max": "Search query must not exceed 200 characters",
    }),
});
