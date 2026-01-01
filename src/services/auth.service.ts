import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request } from "express";
import { User } from "../models/User";
import { Organization } from "../models/Organization";
import { extractSubdomain } from "../utils/subdomain";

export interface LoginCredentials {
  email?: string;
  phoneNumber?: string;
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
  async login(
    req: Request,
    credentials: LoginCredentials
  ): Promise<AuthResult> {
    const { email, phoneNumber, password } = credentials;

    // Extract subdomain from request
    const subdomain = extractSubdomain(req);
    if (!subdomain) {
      throw new Error("Invalid subdomain");
    }

    // Find organization by subdomain
    const organization = await Organization.findOne({ subdomain });
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
      user = await User.findOne({
        email,
        orgId: organization._id,
        isActive: true,
      });
    } else if (phoneNumber) {
      // Login with phone number - phoneNumber is already in E.164 format from Joi validation
      // Include orgId for multi-tenant isolation and to use the compound index
      user = await User.findOne({
        phoneNumber,
        orgId: organization._id,
        isActive: true,
      });
    }

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error("Invalid credentials");
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT secret not configured");
    }

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
