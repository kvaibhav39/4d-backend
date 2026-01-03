"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
// Import models to ensure they're registered
require("./models/Organization");
require("./models/User");
require("./models/Category");
require("./models/Product");
require("./models/Order");
require("./models/Booking");
const auth_1 = __importDefault(require("./routes/auth"));
const categories_1 = __importDefault(require("./routes/categories"));
const products_1 = __importDefault(require("./routes/products"));
const orders_1 = __importDefault(require("./routes/orders"));
const bookings_1 = __importDefault(require("./routes/bookings"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const public_1 = __importDefault(require("./routes/public"));
const database_indexes_1 = require("./config/database-indexes");
const logger_1 = require("./utils/logger");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "50mb" })); // Increase body size limit for large payloads
app.use(express_1.default.urlencoded({ extended: true, limit: "50mb" })); // For form data
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/4dcholi";
const PORT = process.env.PORT || 4000;
mongoose_1.default
    .connect(MONGODB_URI)
    .then(async () => {
    (0, logger_1.logInfo)("Connected to MongoDB");
    // Create database indexes for optimal query performance
    await (0, database_indexes_1.createDatabaseIndexes)();
})
    .catch((err) => {
    (0, logger_1.logError)("MongoDB connection error", err);
    process.exit(1);
});
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
app.use("/api/auth", auth_1.default);
app.use("/api/categories", categories_1.default);
app.use("/api/products", products_1.default);
app.use("/api/orders", orders_1.default);
app.use("/api/bookings", bookings_1.default);
app.use("/api/dashboard", dashboard_1.default);
app.use("/api/public", public_1.default);
// Global error handler middleware - catches all errors
app.use((err, req, res, next) => {
    (0, logger_1.logError)("Unhandled error in request", err);
    res.status(err.status || 500).json({
        message: err.message || "Internal server error",
        timestamp: new Date().toISOString(),
    });
});
// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
    (0, logger_1.logError)("Uncaught Exception", error);
    process.exit(1);
});
// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
    (0, logger_1.logError)("Unhandled Rejection", reason);
});
app.listen(PORT, () => {
    (0, logger_1.logInfo)(`Backend server listening on port ${PORT}`);
});
