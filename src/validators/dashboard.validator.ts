import Joi from "joi";

export const dashboardStatsQuerySchema = Joi.object({
  date: Joi.date().iso().optional().messages({
    "date.base": "Date must be a valid date",
    "date.format": "Date must be in ISO format",
  }),
});

export const dashboardBookingsQuerySchema = Joi.object({
  date: Joi.date().iso().optional().messages({
    "date.base": "Date must be a valid date",
    "date.format": "Date must be in ISO format",
  }),
});

export const dashboardRecentBookingsQuerySchema = Joi.object({
  days: Joi.number().integer().min(1).max(30).optional().messages({
    "number.base": "Days must be a number",
    "number.integer": "Days must be an integer",
    "number.min": "Days must be at least 1",
    "number.max": "Days must not exceed 30",
  }),
});

export const dashboardCustomerPickupsQuerySchema = Joi.object({
  days: Joi.number().integer().min(1).max(30).optional().messages({
    "number.base": "Days must be a number",
    "number.integer": "Days must be an integer",
    "number.min": "Days must be at least 1",
    "number.max": "Days must not exceed 30",
  }),
});

export const dashboardCustomerReturnsQuerySchema = Joi.object({
  days: Joi.number().integer().min(1).max(30).optional().messages({
    "number.base": "Days must be a number",
    "number.integer": "Days must be an integer",
    "number.min": "Days must be at least 1",
    "number.max": "Days must not exceed 30",
  }),
});
