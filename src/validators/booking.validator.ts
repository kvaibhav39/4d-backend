import Joi from "joi";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const checkConflictsSchema = Joi.object({
  productId: Joi.string().pattern(objectIdPattern).required().messages({
    "string.pattern.base": "Invalid product ID format",
    "any.required": "Product ID is required",
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
  excludeBookingId: Joi.string().pattern(objectIdPattern).optional().messages({
    "string.pattern.base": "Invalid booking ID format",
  }),
});

export const updateBookingSchema = Joi.object({
  productId: Joi.string().pattern(objectIdPattern).optional().messages({
    "string.pattern.base": "Invalid product ID format",
  }),
  categoryId: Joi.string()
    .pattern(objectIdPattern)
    .allow("", null)
    .optional()
    .messages({
      "string.pattern.base": "Invalid category ID format",
    }),
  // Customer info is in order, not booking - removed customerName and customerPhone
  fromDateTime: Joi.date().iso().optional().messages({
    "date.base": "From date time must be a valid date",
    "date.format": "From date time must be in ISO format",
  }),
  toDateTime: Joi.date().iso().optional().messages({
    "date.base": "To date time must be a valid date",
    "date.format": "To date time must be in ISO format",
  }),
  decidedRent: Joi.number().min(0).optional().messages({
    "number.base": "Decided rent must be a number",
    "number.min": "Decided rent must be 0 or greater",
  }),
  advanceAmount: Joi.number().min(0).optional().messages({
    "number.base": "Advance amount must be a number",
    "number.min": "Advance amount must be 0 or greater",
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
}).custom((value, helpers) => {
  if (value.fromDateTime && value.toDateTime) {
    if (new Date(value.toDateTime) <= new Date(value.fromDateTime)) {
      return helpers.error("date.greater");
    }
  }
  return value;
}, "Date validation");

export const issueProductSchema = Joi.object({
  paymentAmount: Joi.number().min(0).optional().messages({
    "number.min": "Payment amount must be positive or zero",
  }),
  paymentNote: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow("", null)
    .messages({
      "string.max": "Payment note must not exceed 500 characters",
    }),
});

export const returnProductSchema = Joi.object({
  paymentAmount: Joi.number().min(0).optional().messages({
    "number.min": "Payment amount must be positive or zero",
  }),
  paymentNote: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow("", null)
    .messages({
      "string.max": "Payment note must not exceed 500 characters",
    }),
});

export const cancelBookingSchema = Joi.object({
  shouldTransfer: Joi.boolean().optional(),
  transfers: Joi.array()
    .items(
      Joi.object({
        bookingId: Joi.string().pattern(objectIdPattern).required().messages({
          "string.pattern.base": "Invalid booking ID format",
          "any.required": "Booking ID is required",
        }),
        amount: Joi.number().min(0.01).required().messages({
          "number.base": "Transfer amount must be a number",
          "number.min": "Transfer amount must be greater than 0",
          "any.required": "Transfer amount is required",
        }),
      })
    )
    .optional(),
  shouldRefund: Joi.boolean().optional(),
  refundAmount: Joi.number().min(0).optional().messages({
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

export const addPaymentSchema = Joi.object({
  type: Joi.string()
    .valid("ADVANCE", "PAYMENT_RECEIVED", "REFUND")
    .required()
    .messages({
      "any.only":
        "Payment type must be one of: ADVANCE, PAYMENT_RECEIVED, REFUND",
      "any.required": "Payment type is required",
    }),
  amount: Joi.number().min(0).required().messages({
    "number.base": "Amount must be a number",
    "number.min": "Amount must be 0 or greater",
    "any.required": "Amount is required",
  }),
  note: Joi.string().trim().max(500).allow("", null).optional().messages({
    "string.max": "Note must not exceed 500 characters",
  }),
});

export const getBookingParamsSchema = Joi.object({
  id: Joi.string().pattern(objectIdPattern).required().messages({
    "string.pattern.base": "Invalid booking ID format",
    "any.required": "Booking ID is required",
  }),
});

export const listBookingsQuerySchema = Joi.object({
  status: Joi.string()
    .valid("BOOKED", "ISSUED", "RETURNED", "CANCELLED")
    .optional()
    .messages({
      "any.only": "Status must be one of: BOOKED, ISSUED, RETURNED, CANCELLED",
    }),
  startDate: Joi.date().iso().optional().messages({
    "date.base": "Start date must be a valid date",
    "date.format": "Start date must be in ISO format",
  }),
  endDate: Joi.date().iso().optional().messages({
    "date.base": "End date must be a valid date",
    "date.format": "End date must be in ISO format",
  }),
  productId: Joi.string().pattern(objectIdPattern).optional().messages({
    "string.pattern.base": "Invalid product ID format",
  }),
  search: Joi.string().trim().max(200).optional().allow("").messages({
    "string.max": "Search query must not exceed 200 characters",
  }),
});
