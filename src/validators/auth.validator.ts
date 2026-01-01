import Joi from "joi";
import {
  normalizePhoneNumber,
  isValidPhoneNumberWithCountry,
} from "../utils/phone";

// Custom validation for phone numbers with strict country-specific validation
const phoneNumberValidation = Joi.string()
  .custom((value, helpers) => {
    if (!value) return value;

    // First, normalize the phone number
    const normalized = normalizePhoneNumber(value);
    if (!normalized) {
      return helpers.error("string.phoneInvalid");
    }

    // Then, validate with strict country-specific rules
    if (!isValidPhoneNumberWithCountry(normalized)) {
      return helpers.error("string.phoneInvalid");
    }

    // Return normalized value for use in service
    return normalized;
  }, "Phone number validation")
  .optional()
  .messages({
    "string.base": "Phone number must be a string",
    "string.phoneInvalid":
      "Phone number must be a valid international format with correct country code (e.g., +91 9876543210)",
  });

export const loginSchema = Joi.object({
  email: Joi.string().email().optional().messages({
    "string.email": "Email must be a valid email address",
  }),
  phoneNumber: phoneNumberValidation,
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters",
    "any.required": "Password is required",
  }),
})
  .or("email", "phoneNumber")
  .messages({
    "object.missing": "Either email or phone number is required",
  });
