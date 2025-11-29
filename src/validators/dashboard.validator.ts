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

