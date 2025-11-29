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
require("./models/Booking");
const auth_1 = __importDefault(require("./routes/auth"));
const categories_1 = __importDefault(require("./routes/categories"));
const products_1 = __importDefault(require("./routes/products"));
const bookings_1 = __importDefault(require("./routes/bookings"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
// Debug: Check if routes loaded
console.log("Routes loaded - categories:", !!categories_1.default, "products:", !!products_1.default);
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/4dcholi";
const PORT = process.env.PORT || 4000;
mongoose_1.default
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
app.use("/api/auth", auth_1.default);
console.log("Registering /api/categories route...");
app.use("/api/categories", categories_1.default);
console.log("Registering /api/products route...");
app.use("/api/products", products_1.default);
app.use("/api/bookings", bookings_1.default);
app.use("/api/dashboard", dashboard_1.default);
app.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`);
});
