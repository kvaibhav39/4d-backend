import Joi from "joi";
import mongoose from "mongoose";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required().messages({
    "string.empty": "Category name cannot be empty",
    "string.min": "Category name must be at least 1 character",
    "string.max": "Category name must not exceed 100 characters",
    "any.required": "Category name is required",
  }),
  description: Joi.string().trim().max(500).allow("", null).optional().messages({
    "string.max": "Description must not exceed 500 characters",
  }),
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).optional().messages({
    "string.empty": "Category name cannot be empty",
    "string.min": "Category name must be at least 1 character",
    "string.max": "Category name must not exceed 100 characters",
  }),
  description: Joi.string().trim().max(500).allow("", null).optional().messages({
    "string.max": "Description must not exceed 500 characters",
  }),
  isActive: Joi.boolean().optional(),
});

export const getCategoryParamsSchema = Joi.object({
  id: Joi.string().pattern(objectIdPattern).required().messages({
    "string.pattern.base": "Invalid category ID format",
    "any.required": "Category ID is required",
  }),
});

export const listCategoriesQuerySchema = Joi.object({
  search: Joi.string().trim().max(100).optional().messages({
    "string.max": "Search term must not exceed 100 characters",
  }),
});

