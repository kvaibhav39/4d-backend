"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDatabaseIndexes = createDatabaseIndexes;
exports.dropDatabaseIndexes = dropDatabaseIndexes;
exports.listCollectionIndexes = listCollectionIndexes;
const mongoose_1 = __importDefault(require("mongoose"));
const Product_1 = require("../models/Product");
const Order_1 = require("../models/Order");
const Booking_1 = require("../models/Booking");
const Category_1 = require("../models/Category");
const User_1 = require("../models/User");
/**
 * Create database indexes for optimal query performance
 * Call this function after database connection is established
 */
async function createDatabaseIndexes() {
    try {
        console.log("Creating database indexes...");
        // Product indexes
        await Product_1.Product.collection.createIndex({ orgId: 1, isActive: 1 });
        await Product_1.Product.collection.createIndex({ orgId: 1, code: 1 }, { unique: true });
        await Product_1.Product.collection.createIndex({ orgId: 1, title: "text", code: "text" });
        await Product_1.Product.collection.createIndex({ orgId: 1, categoryId: 1 });
        await Product_1.Product.collection.createIndex({ createdAt: -1 });
        // Order indexes
        await Order_1.Order.collection.createIndex({ orgId: 1, status: 1 });
        await Order_1.Order.collection.createIndex({ orgId: 1, createdAt: -1 });
        await Order_1.Order.collection.createIndex({ orgId: 1, customerName: "text", customerPhone: "text" });
        await Order_1.Order.collection.createIndex({ customerPhone: 1 });
        // Index for search optimization
        await Order_1.Order.collection.createIndex({ orgId: 1, customerName: 1 });
        await Order_1.Order.collection.createIndex({ orgId: 1, customerPhone: 1 });
        // Booking indexes
        await Booking_1.Booking.collection.createIndex({ orgId: 1, status: 1 });
        await Booking_1.Booking.collection.createIndex({ orgId: 1, productId: 1, status: 1 });
        await Booking_1.Booking.collection.createIndex({ orgId: 1, fromDateTime: 1, toDateTime: 1 });
        await Booking_1.Booking.collection.createIndex({ orderId: 1 });
        await Booking_1.Booking.collection.createIndex({ productId: 1, fromDateTime: 1, toDateTime: 1, status: 1 });
        await Booking_1.Booking.collection.createIndex({ createdAt: -1 });
        // Compound index for conflict checking
        await Booking_1.Booking.collection.createIndex({
            orgId: 1,
            productId: 1,
            status: 1,
            fromDateTime: 1,
            toDateTime: 1,
        });
        // Category indexes
        await Category_1.Category.collection.createIndex({ orgId: 1, isActive: 1 });
        await Category_1.Category.collection.createIndex({ orgId: 1, name: 1 });
        // User indexes
        await User_1.User.collection.createIndex({ email: 1 }, { unique: true });
        await User_1.User.collection.createIndex({ orgId: 1, isActive: 1 });
        console.log("Database indexes created successfully");
    }
    catch (error) {
        console.error("Error creating database indexes:", error.message);
        // Don't throw - indexes might already exist
    }
}
/**
 * Drop all custom indexes (for testing/reset purposes)
 * WARNING: This will drop all indexes except _id
 */
async function dropDatabaseIndexes() {
    try {
        console.log("Dropping database indexes...");
        await Product_1.Product.collection.dropIndexes();
        await Order_1.Order.collection.dropIndexes();
        await Booking_1.Booking.collection.dropIndexes();
        await Category_1.Category.collection.dropIndexes();
        await User_1.User.collection.dropIndexes();
        console.log("Database indexes dropped successfully");
    }
    catch (error) {
        console.error("Error dropping database indexes:", error.message);
    }
}
/**
 * List all indexes for a collection
 */
async function listCollectionIndexes(collectionName) {
    try {
        const collection = mongoose_1.default.connection.collection(collectionName);
        const indexes = await collection.indexes();
        return indexes;
    }
    catch (error) {
        console.error(`Error listing indexes for ${collectionName}:`, error.message);
        return [];
    }
}
