"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePhoneNumber = normalizePhoneNumber;
exports.isValidPhoneNumberWithCountry = isValidPhoneNumberWithCountry;
exports.isEmail = isEmail;
exports.detectIdentifierType = detectIdentifierType;
/**
 * Phone number normalization and validation utilities
 * Uses libphonenumber-js for country-specific validation and normalization
 */
const libphonenumber_js_1 = require("libphonenumber-js");
/**
 * Normalizes a phone number to E.164 format with strict validation
 * Uses libphonenumber-js for country-specific validation
 * Handles Indian phone numbers (10 digits) and converts to +91XXXXXXXXXX
 * Also handles already formatted E.164 numbers
 *
 * @param phone - Phone number in various formats
 * @returns Normalized phone number in E.164 format or null if invalid
 */
function normalizePhoneNumber(phone) {
    if (!phone || phone.trim() === "")
        return null;
    try {
        // If already in E.164 format (starts with +), validate and return
        if (phone.startsWith("+")) {
            // Validate using libphonenumber-js
            if (!(0, libphonenumber_js_1.isValidPhoneNumber)(phone)) {
                return null;
            }
            // Parse to ensure it's correctly formatted
            const phoneNumber = (0, libphonenumber_js_1.parsePhoneNumberFromString)(phone);
            if (!phoneNumber || !phoneNumber.isValid()) {
                return null;
            }
            return phoneNumber.number; // Returns E.164 format
        }
        // Handle Indian phone numbers (10 digits starting with 6-9)
        const digitsOnly = phone.replace(/\D/g, "");
        // Check if it's a 10-digit Indian number
        if (/^[6-9]\d{9}$/.test(digitsOnly)) {
            const indianNumber = `+91${digitsOnly}`;
            // Validate the normalized number
            if ((0, libphonenumber_js_1.isValidPhoneNumber)(indianNumber)) {
                const phoneNumber = (0, libphonenumber_js_1.parsePhoneNumberFromString)(indianNumber);
                if (phoneNumber && phoneNumber.isValid()) {
                    return phoneNumber.number;
                }
            }
            return null;
        }
        // If it's 12 digits and starts with 91, it might already have country code
        if (/^91[6-9]\d{9}$/.test(digitsOnly)) {
            const indianNumber = `+${digitsOnly}`;
            // Validate the normalized number
            if ((0, libphonenumber_js_1.isValidPhoneNumber)(indianNumber)) {
                const phoneNumber = (0, libphonenumber_js_1.parsePhoneNumberFromString)(indianNumber);
                if (phoneNumber && phoneNumber.isValid()) {
                    return phoneNumber.number;
                }
            }
            return null;
        }
        // Try to parse as-is (might be in national format with country code)
        // Use AsYouType to help format
        const formatter = new libphonenumber_js_1.AsYouType();
        formatter.input(phone);
        const country = formatter.getCountry();
        const number = formatter.getNumber();
        if (number && (0, libphonenumber_js_1.isValidPhoneNumber)(number.number)) {
            const phoneNumber = (0, libphonenumber_js_1.parsePhoneNumberFromString)(number.number);
            if (phoneNumber && phoneNumber.isValid()) {
                return phoneNumber.number;
            }
        }
        return null;
    }
    catch (error) {
        // If parsing fails, the number is invalid
        return null;
    }
}
/**
 * Validates phone number with country-specific validation
 * Uses libphonenumber-js for strict validation based on country code
 *
 * @param phoneNumber - Phone number in E.164 format (e.g., +919876543210)
 * @returns true if valid, false otherwise
 */
function isValidPhoneNumberWithCountry(phoneNumber) {
    if (!phoneNumber || phoneNumber.trim() === "") {
        return false;
    }
    try {
        // Use libphonenumber-js for strict validation
        if (!(0, libphonenumber_js_1.isValidPhoneNumber)(phoneNumber)) {
            return false;
        }
        // Parse the phone number to ensure it's correctly formatted
        const phoneNumberObj = (0, libphonenumber_js_1.parsePhoneNumberFromString)(phoneNumber);
        if (!phoneNumberObj) {
            return false;
        }
        // Double-check validity - this ensures country-specific rules are met
        // For example, Indian numbers must be exactly 10 digits after country code
        return phoneNumberObj.isValid();
    }
    catch (error) {
        // If parsing fails, the number is invalid
        return false;
    }
}
/**
 * Validates if a string is a valid email address
 * @param str - String to check
 * @returns true if valid email, false otherwise
 */
function isEmail(str) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(str);
}
/**
 * Detects if the input is an email or phone number
 * @param input - Input string to detect
 * @returns 'email' | 'phone' | null
 */
function detectIdentifierType(input) {
    if (!input)
        return null;
    // Check if it's an email
    if (isEmail(input)) {
        return "email";
    }
    // Check if it could be a phone number (has digits)
    const hasDigits = /\d/.test(input);
    if (hasDigits) {
        // Try to normalize - if it succeeds, it's a phone number
        const normalized = normalizePhoneNumber(input);
        if (normalized) {
            return "phone";
        }
    }
    return null;
}
