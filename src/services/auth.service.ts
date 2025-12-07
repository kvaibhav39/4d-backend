import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    orgId: any;
  };
}

export class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const { email, password } = credentials;

    const user = await User.findOne({ email, isActive: true });
    console.log("user", user);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
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
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        orgId: orgIdStr,
        role: user.role,
      },
      secret,
      { expiresIn: "8h" }
    );

    const userWithOrg = await User.findById(user._id).populate("orgId");
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

  async getCurrentUser(userId: string) {
    const user = await User.findById(userId)
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
