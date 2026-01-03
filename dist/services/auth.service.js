"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const Organization_1 = require("../models/Organization");
const subdomain_1 = require("../utils/subdomain");
class AuthService {
    async login(req, credentials) {
        const { email, phoneNumber, password } = credentials;
        // Extract subdomain from request
        const subdomain = (0, subdomain_1.extractSubdomain)(req);
        if (!subdomain) {
            throw new Error("Invalid subdomain");
        }
        // Find organization by subdomain
        const organization = await Organization_1.Organization.findOne({ subdomain });
        if (!organization) {
            // Use generic error message to avoid information leakage
            throw new Error("Invalid credentials");
        }
        const orgIdStr = String(organization._id);
        // Determine which identifier was provided
        // Note: phoneNumber is already normalized by Joi validator
        let user;
        if (email) {
            // Login with email - include orgId for multi-tenant isolation
            user = await User_1.User.findOne({
                email,
                orgId: organization._id,
                isActive: true,
            });
        }
        else if (phoneNumber) {
            // Login with phone number - phoneNumber is already in E.164 format from Joi validation
            // Include orgId for multi-tenant isolation and to use the compound index
            user = await User_1.User.findOne({
                phoneNumber,
                orgId: organization._id,
                isActive: true,
            });
        }
        if (!user) {
            throw new Error("Invalid credentials");
        }
        // Verify password
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            throw new Error("Invalid credentials");
        }
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error("JWT secret not configured");
        }
        const token = jsonwebtoken_1.default.sign({
            userId: user._id.toString(),
            orgId: orgIdStr,
            role: user.role,
        }, secret, { expiresIn: "8h" });
        const userWithOrg = await User_1.User.findById(user._id).populate("orgId");
        if (!userWithOrg) {
            throw new Error("User not found");
        }
        return {
            token,
            user: {
                id: userWithOrg._id.toString(),
                name: userWithOrg.name,
                email: userWithOrg.email,
                role: userWithOrg.role,
                orgId: userWithOrg.orgId,
            },
        };
    }
    async getCurrentUser(userId) {
        const user = await User_1.User.findById(userId)
            .select("-passwordHash")
            .populate("orgId");
        if (!user) {
            throw new Error("User not found");
        }
        return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            orgId: user.orgId,
        };
    }
}
exports.AuthService = AuthService;
