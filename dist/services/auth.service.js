"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
class AuthService {
    async login(credentials) {
        const { email, password } = credentials;
        const user = await User_1.User.findOne({ email, isActive: true });
        console.log("user", user);
        if (!user) {
            throw new Error("Invalid credentials");
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        console.log("isMatch", isMatch);
        console.log("password", password);
        console.log("user.passwordHash", user.passwordHash);
        if (!isMatch) {
            throw new Error("Invalid credentials");
        }
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error("JWT secret not configured");
        }
        const orgIdStr = String(user.orgId);
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
