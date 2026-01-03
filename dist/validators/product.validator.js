"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkUpdateProductOrderSchema = exports.getProductBookingsQuerySchema = exports.listProductsQuerySchema = exports.getProductParamsSchema = exports.updateProductSchema = exports.createProductSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const objectIdPattern = /^[0-9a-fA-F]{24}$/;
exports.createProductSchema = joi_1.default.object({
    title: joi_1.default.string().trim().min(1).max(200).required().messages({
        "string.empty": "Product title cannot be empty",
        "string.min": "Product title must be at least 1 character",
        "string.max": "Product title must not exceed 200 characters",
        "any.required": "Product title is required",
    }),
    description: joi_1.default.string()
        .trim()
        .max(1000)
        .allow("", null)
        .optional()
        .messages({
        "string.max": "Description must not exceed 1000 characters",
    }),
    code: joi_1.default.string().trim().min(1).max(50).required().messages({
        "string.empty": "Product code cannot be empty",
        "string.min": "Product code must be at least 1 character",
        "string.max": "Product code must not exceed 50 characters",
        "any.required": "Product code is required",
    }),
    categoryId: joi_1.default.string()
        .pattern(objectIdPattern)
        .allow("", null)
        .optional()
        .messages({
        "string.pattern.base": "Invalid category ID format",
    }),
    defaultRent: joi_1.default.number().min(0).required().messages({
        "number.base": "Default rent must be a number",
        "number.min": "Default rent must be 0 or greater",
        "any.required": "Default rent is required",
    }),
    color: joi_1.default.string().trim().max(50).allow("", null).optional().messages({
        "string.max": "Color must not exceed 50 characters",
    }),
    size: joi_1.default.string().trim().max(50).allow("", null).optional().messages({
        "string.max": "Size must not exceed 50 characters",
    }),
    featuredOrder: joi_1.default.number().integer().min(0).allow(null).optional().messages({
        "number.base": "Featured order must be a number",
        "number.min": "Featured order must be 0 or greater",
        "number.integer": "Featured order must be an integer",
    }),
});
exports.updateProductSchema = joi_1.default.object({
    title: joi_1.default.string().trim().min(1).max(200).optional().messages({
        "string.empty": "Product title cannot be empty",
        "string.min": "Product title must be at least 1 character",
        "string.max": "Product title must not exceed 200 characters",
    }),
    description: joi_1.default.string()
        .trim()
        .max(1000)
        .allow("", null)
        .optional()
        .messages({
        "string.max": "Description must not exceed 1000 characters",
    }),
    code: joi_1.default.string().trim().min(1).max(50).optional().messages({
        "string.empty": "Product code cannot be empty",
        "string.min": "Product code must be at least 1 character",
        "string.max": "Product code must not exceed 50 characters",
    }),
    categoryId: joi_1.default.string()
        .pattern(objectIdPattern)
        .allow("", null)
        .optional()
        .messages({
        "string.pattern.base": "Invalid category ID format",
    }),
    defaultRent: joi_1.default.number().min(0).optional().messages({
        "number.base": "Default rent must be a number",
        "number.min": "Default rent must be 0 or greater",
    }),
    color: joi_1.default.string().trim().max(50).allow("", null).optional().messages({
        "string.max": "Color must not exceed 50 characters",
    }),
    size: joi_1.default.string().trim().max(50).allow("", null).optional().messages({
        "string.max": "Size must not exceed 50 characters",
    }),
    isActive: joi_1.default.boolean().optional(),
    featuredOrder: joi_1.default.number().integer().min(0).allow(null).optional().messages({
        "number.base": "Featured order must be a number",
        "number.min": "Featured order must be 0 or greater",
        "number.integer": "Featured order must be an integer",
    }),
});
exports.getProductParamsSchema = joi_1.default.object({
    id: joi_1.default.string().pattern(objectIdPattern).required().messages({
        "string.pattern.base": "Invalid product ID format",
        "any.required": "Product ID is required",
    }),
});
exports.listProductsQuerySchema = joi_1.default.object({
    search: joi_1.default.string().trim().max(100).optional().messages({
        "string.max": "Search term must not exceed 100 characters",
    }),
});
exports.getProductBookingsQuerySchema = joi_1.default.object({
    filterDate: joi_1.default.date().iso().optional().messages({
        "date.base": "Filter date must be a valid date",
        "date.format": "Filter date must be in ISO format",
    }),
});
exports.bulkUpdateProductOrderSchema = joi_1.default.object({
    updates: joi_1.default.array()
        .items(joi_1.default.object({
        id: joi_1.default.string()
            .pattern(objectIdPattern)
            .required()
            .messages({
            "string.pattern.base": "Invalid product ID format",
            "any.required": "Product ID is required",
        }),
        featuredOrder: joi_1.default.number()
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
    }))
        .min(1)
        .required()
        .messages({
        "array.min": "At least one product update is required",
        "any.required": "Updates array is required",
    }),
});
