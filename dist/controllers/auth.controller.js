"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const authService = new auth_service_1.AuthService();
class AuthController {
    async login(req, res) {
        try {
            const result = await authService.login(req.body);
            res.json(result);
        }
        catch (error) {
            if (error.message === "Invalid credentials") {
                return res.status(401).json({ message: error.message });
            }
            console.error("Login error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async getCurrentUser(req, res) {
        try {
            const userId = req.user.userId;
            const user = await authService.getCurrentUser(userId);
            res.json(user);
        }
        catch (error) {
            if (error.message === "User not found") {
                return res.status(404).json({ message: error.message });
            }
            console.error("Get user error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
}
exports.AuthController = AuthController;
