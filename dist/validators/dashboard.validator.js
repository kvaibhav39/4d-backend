"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardBookingsQuerySchema = exports.dashboardStatsQuerySchema = void 0;
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
