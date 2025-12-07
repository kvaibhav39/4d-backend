"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardCustomerReturnsQuerySchema = exports.dashboardCustomerPickupsQuerySchema = exports.dashboardRecentBookingsQuerySchema = exports.dashboardBookingsQuerySchema = exports.dashboardStatsQuerySchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.dashboardStatsQuerySchema = joi_1.default.object({
    date: joi_1.default.date().iso().optional().messages({
        "date.base": "Date must be a valid date",
        "date.format": "Date must be in ISO format",
    }),
});
exports.dashboardBookingsQuerySchema = joi_1.default.object({
    date: joi_1.default.date().iso().optional().messages({
        "date.base": "Date must be a valid date",
        "date.format": "Date must be in ISO format",
    }),
});
exports.dashboardRecentBookingsQuerySchema = joi_1.default.object({
    days: joi_1.default.number().integer().min(1).max(30).optional().messages({
        "number.base": "Days must be a number",
        "number.integer": "Days must be an integer",
        "number.min": "Days must be at least 1",
        "number.max": "Days must not exceed 30",
    }),
});
exports.dashboardCustomerPickupsQuerySchema = joi_1.default.object({
    days: joi_1.default.number().integer().min(1).max(30).optional().messages({
        "number.base": "Days must be a number",
        "number.integer": "Days must be an integer",
        "number.min": "Days must be at least 1",
        "number.max": "Days must not exceed 30",
    }),
});
exports.dashboardCustomerReturnsQuerySchema = joi_1.default.object({
    days: joi_1.default.number().integer().min(1).max(30).optional().messages({
        "number.base": "Days must be a number",
        "number.integer": "Days must be an integer",
        "number.min": "Days must be at least 1",
        "number.max": "Days must not exceed 30",
    }),
});
