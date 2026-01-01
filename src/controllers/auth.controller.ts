import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { AuthService } from "../services/auth.service";

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const result = await authService.login(req, req.body);
      res.json(result);
    } catch (error: any) {
      if (error.message === "Invalid credentials" || error.message === "Invalid subdomain") {
        return res.status(401).json({ message: error.message });
      }
      console.error("Login error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getCurrentUser(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const user = await authService.getCurrentUser(userId);
      res.json(user);
    } catch (error: any) {
      if (error.message === "User not found") {
        return res.status(404).json({ message: error.message });
      }
      console.error("Get user error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}

