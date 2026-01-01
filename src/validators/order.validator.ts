import Joi from "joi";
import {
  normalizePhoneNumber,
  isValidPhoneNumberWithCountry,
} from "../utils/phone";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

// Reusable phone number validation for customer phone (optional field)
const customerPhoneValidation = Joi.string()
  .trim()
  .custom((value, helpers) => {
    // Allow empty string or null (optional field)
    if (!value || value === "" || value === null) {
      return value;
    }

    // Normalize the phone number
    const normalized = normalizePhoneNumber(value);
    if (!normalized) {
      return helpers.error("string.phoneInvalid");
    }

    // Validate with strict country-specific rules
    if (!isValidPhoneNumberWithCountry(normalized)) {
      return helpers.error("string.phoneInvalid");
    }

    // Return normalized value
    return normalized;
  }, "Phone number validation")
  .allow("", null)
  .optional()
  .messages({
    "string.base": "Customer phone must be a string",
    "string.phoneInvalid":
      "Phone number must be a valid international format with correct country code (e.g., +91 9876543210)",
  });

export const createOrderSchema = Joi.object({
  customerName: Joi.string().trim().min(1).max(200).required().messages({
    "string.empty": "Customer name cannot be empty",
    "string.min": "Customer name must be at least 1 character",
    "string.max": "Customer name must not exceed 200 characters",
    "any.required": "Customer name is required",
  }),
  customerPhone: customerPhoneValidation,
  bookings: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().pattern(objectIdPattern).required().messages({
          "string.pattern.base": "Invalid product ID format",
          "any.required": "Product ID is required",
        }),
        categoryId: Joi.string()
          .pattern(objectIdPattern)
          .allow("", null)
          .optional()
          .messages({
            "string.pattern.base": "Invalid category ID format",
          }),
        fromDateTime: Joi.date().iso().required().messages({
          "date.base": "From date time must be a valid date",
          "date.format": "From date time must be in ISO format",
          "any.required": "From date time is required",
        }),
        toDateTime: Joi.date()
          .iso()
          .greater(Joi.ref("fromDateTime"))
          .required()
          .messages({
            "date.base": "To date time must be a valid date",
            "date.format": "To date time must be in ISO format",
            "date.greater": "To date time must be after from date time",
            "any.required": "To date time is required",
          }),
        decidedRent: Joi.number().min(0).required().messages({
          "number.base": "Decided rent must be a number",
          "number.min": "Decided rent must be 0 or greater",
          "any.required": "Decided rent is required",
        }),
        advanceAmount: Joi.number().min(0).required().messages({
          "number.base": "Advance amount must be a number",
          "number.min": "Advance amount must be 0 or greater",
          "any.required": "Advance amount is required",
        }),
        additionalItemsDescription: Joi.string()
          .trim()
          .max(1000)
          .allow("", null)
          .optional()
          .messages({
            "string.max":
              "Additional items description must not exceed 1000 characters",
          }),
        overrideConflicts: Joi.boolean().optional(),
      })
    )
    .optional()
    .messages({
      "array.base": "Bookings must be an array",
    }),
});

export const updateOrderSchema = Joi.object({
  customerName: Joi.string().trim().min(1).max(200).optional().messages({
    "string.empty": "Customer name cannot be empty",
    "string.min": "Customer name must be at least 1 character",
    "string.max": "Customer name must not exceed 200 characters",
  }),
  customerPhone: customerPhoneValidation,
});

export const addBookingToOrderSchema = Joi.object({
  productId: Joi.string().pattern(objectIdPattern).required().messages({
    "string.pattern.base": "Invalid product ID format",
    "any.required": "Product ID is required",
  }),
  categoryId: Joi.string()
    .pattern(objectIdPattern)
    .allow("", null)
    .optional()
    .messages({
      "string.pattern.base": "Invalid category ID format",
    }),
  fromDateTime: Joi.date().iso().required().messages({
    "date.base": "From date time must be a valid date",
    "date.format": "From date time must be in ISO format",
    "any.required": "From date time is required",
  }),
  toDateTime: Joi.date()
    .iso()
    .greater(Joi.ref("fromDateTime"))
    .required()
    .messages({
      "date.base": "To date time must be a valid date",
      "date.format": "To date time must be in ISO format",
      "date.greater": "To date time must be after from date time",
      "any.required": "To date time is required",
    }),
  decidedRent: Joi.number().min(0).required().messages({
    "number.base": "Decided rent must be a number",
    "number.min": "Decided rent must be 0 or greater",
    "any.required": "Decided rent is required",
  }),
  advanceAmount: Joi.number().min(0).required().messages({
    "number.base": "Advance amount must be a number",
    "number.min": "Advance amount must be 0 or greater",
    "any.required": "Advance amount is required",
  }),
  additionalItemsDescription: Joi.string()
    .trim()
    .max(1000)
    .allow("", null)
    .optional()
    .messages({
      "string.max":
        "Additional items description must not exceed 1000 characters",
    }),
  overrideConflicts: Joi.boolean().optional(),
});

export const cancelOrderSchema = Joi.object({
  refundAmount: Joi.number().min(0).optional().messages({
    "number.base": "Refund amount must be a number",
    "number.min": "Refund amount cannot be negative",
  }),
  refundNote: Joi.string().trim().max(500).allow("", null).optional().messages({
    "string.max": "Refund note must not exceed 500 characters",
  }),
});

export const getOrderParamsSchema = Joi.object({
  id: Joi.string().pattern(objectIdPattern).required().messages({
    "string.pattern.base": "Invalid order ID format",
    "any.required": "Order ID is required",
  }),
});

export const listOrdersQuerySchema = Joi.object({
  status: Joi.string()
    .valid(
      "INITIATED",
      "IN_PROGRESS",
      "PARTIALLY_DONE",
      "FULLY_DONE",
      "CANCELLED"
    )
    .optional()
    .messages({
      "any.only":
        "Status must be one of: INITIATED, IN_PROGRESS, PARTIALLY_DONE, FULLY_DONE, CANCELLED",
    }),
  startDate: Joi.date().iso().optional().messages({
    "date.base": "Start date must be a valid date",
    "date.format": "Start date must be in ISO format",
  }),
  endDate: Joi.date().iso().optional().messages({
    "date.base": "End date must be a valid date",
    "date.format": "End date must be in ISO format",
  }),
  search: Joi.string().trim().max(200).optional().allow("").messages({
    "string.max": "Search query must not exceed 200 characters",
  }),
});
