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
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error", err);
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

app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});
