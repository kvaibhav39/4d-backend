import mongoose from "mongoose";
import { Product } from "../models/Product";
import { Order } from "../models/Order";
import { Booking } from "../models/Booking";
import { Category } from "../models/Category";
import { User } from "../models/User";

/**
 * Create database indexes for optimal query performance
 * Call this function after database connection is established
 */
export async function createDatabaseIndexes(): Promise<void> {
  try {
    console.log("Creating database indexes...");

    // Product indexes
    await Product.collection.createIndex({ orgId: 1, isActive: 1 });
    await Product.collection.createIndex({ orgId: 1, code: 1 }, { unique: true });
    await Product.collection.createIndex({ orgId: 1, title: "text", code: "text" });
    await Product.collection.createIndex({ orgId: 1, categoryId: 1 });
    await Product.collection.createIndex({ createdAt: -1 });

    // Order indexes
    await Order.collection.createIndex({ orgId: 1, status: 1 });
    await Order.collection.createIndex({ orgId: 1, createdAt: -1 });
    await Order.collection.createIndex({ orgId: 1, customerName: "text", customerPhone: "text" });
    await Order.collection.createIndex({ customerPhone: 1 });

    // Booking indexes
    await Booking.collection.createIndex({ orgId: 1, status: 1 });
    await Booking.collection.createIndex({ orgId: 1, productId: 1, status: 1 });
    await Booking.collection.createIndex({ orgId: 1, fromDateTime: 1, toDateTime: 1 });
    await Booking.collection.createIndex({ orderId: 1 });
    await Booking.collection.createIndex({ productId: 1, fromDateTime: 1, toDateTime: 1, status: 1 });
    await Booking.collection.createIndex({ createdAt: -1 });
    
    // Compound index for conflict checking
    await Booking.collection.createIndex({
      orgId: 1,
      productId: 1,
      status: 1,
      fromDateTime: 1,
      toDateTime: 1,
    });

    // Category indexes
    await Category.collection.createIndex({ orgId: 1, isActive: 1 });
    await Category.collection.createIndex({ orgId: 1, name: 1 });

    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ orgId: 1, isActive: 1 });

    console.log("Database indexes created successfully");
  } catch (error: any) {
    console.error("Error creating database indexes:", error.message);
    // Don't throw - indexes might already exist
  }
}

/**
 * Drop all custom indexes (for testing/reset purposes)
 * WARNING: This will drop all indexes except _id
 */
export async function dropDatabaseIndexes(): Promise<void> {
  try {
    console.log("Dropping database indexes...");

    await Product.collection.dropIndexes();
    await Order.collection.dropIndexes();
    await Booking.collection.dropIndexes();
    await Category.collection.dropIndexes();
    await User.collection.dropIndexes();

    console.log("Database indexes dropped successfully");
  } catch (error: any) {
    console.error("Error dropping database indexes:", error.message);
  }
}

/**
 * List all indexes for a collection
 */
export async function listCollectionIndexes(collectionName: string): Promise<any[]> {
  try {
    const collection = mongoose.connection.collection(collectionName);
    const indexes = await collection.indexes();
    return indexes;
  } catch (error: any) {
    console.error(`Error listing indexes for ${collectionName}:`, error.message);
    return [];
  }
}
