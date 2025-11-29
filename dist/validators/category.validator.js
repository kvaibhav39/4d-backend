"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCategoriesQuerySchema = exports.getCategoryParamsSchema = exports.updateCategorySchema = exports.createCategorySchema = void 0;
const joi_1 = __importDefault(require("joi"));
const objectIdPattern = /^[0-9a-fA-F]{24}$/;
exports.createCategorySchema = joi_1.default.object({
    name: joi_1.default.string().trim().min(1).max(100).required().messages({
        "string.empty": "Category name cannot be empty",
        "string.min": "Category name must be at least 1 character",
        "string.max": "Category name must not exceed 100 characters",
        "any.required": "Category name is required",
    }),
    description: joi_1.default.string().trim().max(500).allow("", null).optional().messages({
        "string.max": "Description must not exceed 500 characters",
    }),
});
exports.updateCategorySchema = joi_1.default.object({
    name: joi_1.default.string().trim().min(1).max(100).optional().messages({
        "string.empty": "Category name cannot be empty",
        "string.min": "Category name must be at least 1 character",
        "string.max": "Category name must not exceed 100 characters",
    }),
    description: joi_1.default.string().trim().max(500).allow("", null).optional().messages({
        "string.max": "Description must not exceed 500 characters",
    }),
    isActive: joi_1.default.boolean().optional(),
});
exports.getCategoryParamsSchema = joi_1.default.object({
    id: joi_1.default.string().pattern(objectIdPattern).required().messages({
        "string.pattern.base": "Invalid category ID format",
        "any.required": "Category ID is required",
    }),
});
exports.listCategoriesQuerySchema = joi_1.default.object({
    search: joi_1.default.string().trim().max(100).optional().messages({
        "string.max": "Search term must not exceed 100 characters",
    }),
});
