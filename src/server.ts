import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

// Import models to ensure they're registered
import "./models/Organization";
import "./models/User";
import "./models/Category";
import "./models/Product";
import "./models/Order";
import "./models/Booking";

import authRoutes from "./routes/auth";
import categoryRoutes from "./routes/categories";
import productRoutes from "./routes/products";
import orderRoutes from "./routes/orders";
import bookingRoutes from "./routes/bookings";
import dashboardRoutes from "./routes/dashboard";
import publicRoutes from "./routes/public";

import { createDatabaseIndexes } from "./config/database-indexes";
import { logError, logInfo } from "./utils/logger";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" })); // Increase body size limit for large payloads
app.use(express.urlencoded({ extended: true, limit: "50mb" })); // For form data

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/4dcholi";
const PORT = process.env.PORT || 4000;

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    logInfo("Connected to MongoDB");
    // Create database indexes for optimal query performance
    await createDatabaseIndexes();
  })
  .catch((err) => {
    logError("MongoDB connection error", err);
    process.exit(1);
  });

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/public", publicRoutes);

// Global error handler middleware - catches all errors
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    logError("Unhandled error in request", err);
    res.status(err.status || 500).json({
      message: err.message || "Internal server error",
      timestamp: new Date().toISOString(),
    });
  }
);

// Handle uncaught exceptions
process.on("uncaughtException", (error: Error) => {
  logError("Uncaught Exception", error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
  logError("Unhandled Rejection", reason);
});

app.listen(PORT, () => {
  logInfo(`Backend server listening on port ${PORT}`);
});
