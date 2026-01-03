"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const phone_1 = require("../utils/phone");
// Custom validation for phone numbers with strict country-specific validation
const phoneNumberValidation = joi_1.default.string()
    .custom((value, helpers) => {
    if (!value)
        return value;
    // First, normalize the phone number
    const normalized = (0, phone_1.normalizePhoneNumber)(value);
    if (!normalized) {
        return helpers.error("string.phoneInvalid");
    }
    // Then, validate with strict country-specific rules
    if (!(0, phone_1.isValidPhoneNumberWithCountry)(normalized)) {
        return helpers.error("string.phoneInvalid");
    }
    // Return normalized value for use in service
    return normalized;
}, "Phone number validation")
    .optional()
    .messages({
    "string.base": "Phone number must be a string",
    "string.phoneInvalid": "Phone number must be a valid international format with correct country code (e.g., +91 9876543210)",
});
exports.loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().optional().messages({
        "string.email": "Email must be a valid email address",
    }),
    phoneNumber: phoneNumberValidation,
    password: joi_1.default.string().min(6).required().messages({
        "string.min": "Password must be at least 6 characters",
        "any.required": "Password is required",
    }),
})
    .or("email", "phoneNumber")
    .messages({
    "object.missing": "Either email or phone number is required",
});
