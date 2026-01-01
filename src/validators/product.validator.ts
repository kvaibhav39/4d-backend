import Joi from "joi";
import mongoose from "mongoose";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const createProductSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required().messages({
    "string.empty": "Product title cannot be empty",
    "string.min": "Product title must be at least 1 character",
    "string.max": "Product title must not exceed 200 characters",
    "any.required": "Product title is required",
  }),
  description: Joi.string()
    .trim()
    .max(1000)
    .allow("", null)
    .optional()
    .messages({
      "string.max": "Description must not exceed 1000 characters",
    }),
  code: Joi.string().trim().min(1).max(50).required().messages({
    "string.empty": "Product code cannot be empty",
    "string.min": "Product code must be at least 1 character",
    "string.max": "Product code must not exceed 50 characters",
    "any.required": "Product code is required",
  }),
  categoryId: Joi.string()
    .pattern(objectIdPattern)
    .allow("", null)
    .optional()
    .messages({
      "string.pattern.base": "Invalid category ID format",
    }),
  defaultRent: Joi.number().min(0).required().messages({
    "number.base": "Default rent must be a number",
    "number.min": "Default rent must be 0 or greater",
    "any.required": "Default rent is required",
  }),
  color: Joi.string().trim().max(50).allow("", null).optional().messages({
    "string.max": "Color must not exceed 50 characters",
  }),
  size: Joi.string().trim().max(50).allow("", null).optional().messages({
    "string.max": "Size must not exceed 50 characters",
  }),
  featuredOrder: Joi.number().integer().min(0).allow(null).optional().messages({
    "number.base": "Featured order must be a number",
    "number.min": "Featured order must be 0 or greater",
    "number.integer": "Featured order must be an integer",
  }),
});

export const updateProductSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).optional().messages({
    "string.empty": "Product title cannot be empty",
    "string.min": "Product title must be at least 1 character",
    "string.max": "Product title must not exceed 200 characters",
  }),
  description: Joi.string()
    .trim()
    .max(1000)
    .allow("", null)
    .optional()
    .messages({
      "string.max": "Description must not exceed 1000 characters",
    }),
  code: Joi.string().trim().min(1).max(50).optional().messages({
    "string.empty": "Product code cannot be empty",
    "string.min": "Product code must be at least 1 character",
    "string.max": "Product code must not exceed 50 characters",
  }),
  categoryId: Joi.string()
    .pattern(objectIdPattern)
    .allow("", null)
    .optional()
    .messages({
      "string.pattern.base": "Invalid category ID format",
    }),
  defaultRent: Joi.number().min(0).optional().messages({
    "number.base": "Default rent must be a number",
    "number.min": "Default rent must be 0 or greater",
  }),
  color: Joi.string().trim().max(50).allow("", null).optional().messages({
    "string.max": "Color must not exceed 50 characters",
  }),
  size: Joi.string().trim().max(50).allow("", null).optional().messages({
    "string.max": "Size must not exceed 50 characters",
  }),
  isActive: Joi.boolean().optional(),
  featuredOrder: Joi.number().integer().min(0).allow(null).optional().messages({
    "number.base": "Featured order must be a number",
    "number.min": "Featured order must be 0 or greater",
    "number.integer": "Featured order must be an integer",
  }),
});

export const getProductParamsSchema = Joi.object({
  id: Joi.string().pattern(objectIdPattern).required().messages({
    "string.pattern.base": "Invalid product ID format",
    "any.required": "Product ID is required",
  }),
});

export const listProductsQuerySchema = Joi.object({
  search: Joi.string().trim().max(100).optional().messages({
    "string.max": "Search term must not exceed 100 characters",
  }),
});

export const getProductBookingsQuerySchema = Joi.object({
  filterDate: Joi.date().iso().optional().messages({
    "date.base": "Filter date must be a valid date",
    "date.format": "Filter date must be in ISO format",
  }),
});

export const bulkUpdateProductOrderSchema = Joi.object({
  updates: Joi.array()
    .items(
      Joi.object({
        id: Joi.string()
          .pattern(objectIdPattern)
          .required()
          .messages({
            "string.pattern.base": "Invalid product ID format",
            "any.required": "Product ID is required",
          }),
        featuredOrder: Joi.number()
          .integer()
          .min(0)
          .allow(null)
          .required()
          .messages({
            "number.base": "Featured order must be a number or null",
            "number.min": "Featured order must be 0 or greater",
            "number.integer": "Featured order must be an integer",
            "any.required": "Featured order is required",
          }),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.min": "At least one product update is required",
      "any.required": "Updates array is required",
    }),
});
