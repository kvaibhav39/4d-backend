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
const Organization_1 = require("../models/Organization");
const errorLogger_1 = require("../utils/errorLogger");
/**
 * Create database indexes for optimal query performance
 * Call this function after database connection is established
 *
 * NOTE: MongoDB's createIndex() is idempotent - if an index with the same
 * key and options already exists, it will skip creation. This function is
 * safe to call on every server startup.
 *
 * Indexes defined in Mongoose schemas are automatically created by Mongoose,
 * so we only create additional indexes here that aren't in schemas.
 */
async function createDatabaseIndexes() {
    try {
        console.log("Creating database indexes...");
        // Helper function to safely create index with error handling
        const createIndexSafe = async (collection, indexSpec, options = {}) => {
            try {
                await collection.createIndex(indexSpec, {
                    background: true,
                    ...options,
                });
            }
            catch (error) {
                // Ignore errors for existing indexes with same spec
                if (error.code === 85 || error.codeName === "IndexOptionsConflict") {
                    // Index exists with different options - log but don't fail
                    console.warn(`Index conflict for ${JSON.stringify(indexSpec)}: ${error.message}`);
                }
                else if (error.code !== 86 &&
                    error.codeName !== "IndexKeySpecsConflict") {
                    // Re-throw if it's not a "duplicate index" error
                    throw error;
                }
            }
        };
        // Product indexes
        // Note: { orgId: 1, code: 1 } unique index is already defined in Product schema
        await createIndexSafe(Product_1.Product.collection, { orgId: 1, isActive: 1 });
        await createIndexSafe(Product_1.Product.collection, {
            orgId: 1,
            title: "text",
            code: "text",
        });
        await createIndexSafe(Product_1.Product.collection, { orgId: 1, categoryId: 1 });
        await createIndexSafe(Product_1.Product.collection, { createdAt: -1 });
        // Order indexes
        // Note: { orgId: 1, status: 1 } and { orgId: 1, createdAt: -1 } are already in Order schema
        await createIndexSafe(Order_1.Order.collection, {
            orgId: 1,
            customerName: "text",
            customerPhone: "text",
        });
        await createIndexSafe(Order_1.Order.collection, { customerPhone: 1 });
        await createIndexSafe(Order_1.Order.collection, { orgId: 1, customerName: 1 });
        await createIndexSafe(Order_1.Order.collection, { orgId: 1, customerPhone: 1 });
        // Booking indexes
        // Note: { orgId: 1, productId: 1, fromDateTime: 1, toDateTime: 1 } and { orderId: 1 } are already in Booking schema
        await createIndexSafe(Booking_1.Booking.collection, { orgId: 1, status: 1 });
        await createIndexSafe(Booking_1.Booking.collection, {
            orgId: 1,
            productId: 1,
            status: 1,
        });
        await createIndexSafe(Booking_1.Booking.collection, {
            productId: 1,
            fromDateTime: 1,
            toDateTime: 1,
            status: 1,
        });
        await createIndexSafe(Booking_1.Booking.collection, { createdAt: -1 });
        // Compound index for conflict checking (more specific than schema index)
        await createIndexSafe(Booking_1.Booking.collection, {
            orgId: 1,
            productId: 1,
            status: 1,
            fromDateTime: 1,
            toDateTime: 1,
        });
        // Category indexes
        await createIndexSafe(Category_1.Category.collection, { orgId: 1, isActive: 1 });
        // Note: { orgId: 1, name: 1 } unique index is already defined in Category schema
        // User indexes
        await createIndexSafe(User_1.User.collection, { email: 1 }, { unique: true });
        await createIndexSafe(User_1.User.collection, { orgId: 1, isActive: 1 });
        // Phone number indexes (sparse - only index documents with phoneNumber)
        await createIndexSafe(User_1.User.collection, { orgId: 1, phoneNumber: 1 }, { unique: true, sparse: true });
        await createIndexSafe(User_1.User.collection, { orgId: 1, phoneNumber: 1, isActive: 1 }, { sparse: true });
        // Organization indexes
        // Note: { subdomain: 1 } unique index is already defined in Organization schema
        await createIndexSafe(Organization_1.Organization.collection, { subdomain: 1 }, { unique: true });
        console.log("Database indexes created successfully");
    }
    catch (error) {
        (0, errorLogger_1.logError)("Error creating database indexes", error);
        // Don't throw - indexes might already exist or be created by Mongoose
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
        (0, errorLogger_1.logError)("Error dropping database indexes", error);
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
        (0, errorLogger_1.logError)(`Error listing indexes for ${collectionName}`, error);
        return [];
    }
}
