import mongoose from "mongoose";
import { Product } from "../models/Product";
import { Order } from "../models/Order";
import { Booking } from "../models/Booking";
import { Category } from "../models/Category";
import { User } from "../models/User";
import { Organization } from "../models/Organization";
import { logError, logInfo, logWarn } from "../utils/logger";

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
export async function createDatabaseIndexes(): Promise<void> {
  try {
    logInfo("Creating database indexes...");

    // Helper function to safely create index with error handling
    const createIndexSafe = async (
      collection: mongoose.Collection,
      indexSpec: any,
      options: any = {}
    ) => {
      try {
        await collection.createIndex(indexSpec, {
          background: true,
          ...options,
        });
      } catch (error: any) {
        // Ignore errors for existing indexes with same spec
        if (error.code === 85 || error.codeName === "IndexOptionsConflict") {
          // Index exists with different options - log but don't fail
          logWarn(
            `Index conflict for ${JSON.stringify(indexSpec)}: ${error.message}`
          );
        } else if (
          error.code !== 86 &&
          error.codeName !== "IndexKeySpecsConflict"
        ) {
          // Re-throw if it's not a "duplicate index" error
          throw error;
        }
      }
    };

    // Product indexes
    // Note: { orgId: 1, code: 1 } unique index is already defined in Product schema
    await createIndexSafe(Product.collection, { orgId: 1, isActive: 1 });
    await createIndexSafe(Product.collection, {
      orgId: 1,
      title: "text",
      code: "text",
    });
    await createIndexSafe(Product.collection, { orgId: 1, categoryId: 1 });
    await createIndexSafe(Product.collection, { createdAt: -1 });

    // Order indexes
    // Note: { orgId: 1, status: 1 } and { orgId: 1, createdAt: -1 } are already in Order schema
    await createIndexSafe(Order.collection, {
      orgId: 1,
      customerName: "text",
      customerPhone: "text",
    });
    await createIndexSafe(Order.collection, { customerPhone: 1 });
    await createIndexSafe(Order.collection, { orgId: 1, customerName: 1 });
    await createIndexSafe(Order.collection, { orgId: 1, customerPhone: 1 });

    // Booking indexes
    // Note: { orgId: 1, productId: 1, fromDateTime: 1, toDateTime: 1 } and { orderId: 1 } are already in Booking schema
    await createIndexSafe(Booking.collection, { orgId: 1, status: 1 });
    await createIndexSafe(Booking.collection, {
      orgId: 1,
      productId: 1,
      status: 1,
    });
    await createIndexSafe(Booking.collection, {
      productId: 1,
      fromDateTime: 1,
      toDateTime: 1,
      status: 1,
    });
    await createIndexSafe(Booking.collection, { createdAt: -1 });
    // Compound index for conflict checking (more specific than schema index)
    await createIndexSafe(Booking.collection, {
      orgId: 1,
      productId: 1,
      status: 1,
      fromDateTime: 1,
      toDateTime: 1,
    });

    // Category indexes
    await createIndexSafe(Category.collection, { orgId: 1, isActive: 1 });
    // Note: { orgId: 1, name: 1 } unique index is already defined in Category schema

    // User indexes
    await createIndexSafe(User.collection, { email: 1 }, { unique: true });
    await createIndexSafe(User.collection, { orgId: 1, isActive: 1 });
    // Phone number indexes (sparse - only index documents with phoneNumber)
    await createIndexSafe(
      User.collection,
      { orgId: 1, phoneNumber: 1 },
      { unique: true, sparse: true }
    );
    await createIndexSafe(
      User.collection,
      { orgId: 1, phoneNumber: 1, isActive: 1 },
      { sparse: true }
    );

    // Organization indexes
    // Note: { subdomain: 1 } unique index is already defined in Organization schema
    await createIndexSafe(
      Organization.collection,
      { subdomain: 1 },
      { unique: true }
    );

    logInfo("Database indexes created successfully");
  } catch (error: any) {
    logError("Error creating database indexes", error);
    // Don't throw - indexes might already exist or be created by Mongoose
  }
}

/**
 * Drop all custom indexes (for testing/reset purposes)
 * WARNING: This will drop all indexes except _id
 */
export async function dropDatabaseIndexes(): Promise<void> {
  try {
    logInfo("Dropping database indexes...");

    await Product.collection.dropIndexes();
    await Order.collection.dropIndexes();
    await Booking.collection.dropIndexes();
    await Category.collection.dropIndexes();
    await User.collection.dropIndexes();

    logInfo("Database indexes dropped successfully");
  } catch (error: any) {
    logError("Error dropping database indexes", error);
  }
}

/**
 * List all indexes for a collection
 */
export async function listCollectionIndexes(
  collectionName: string
): Promise<any[]> {
  try {
    const collection = mongoose.connection.collection(collectionName);
    const indexes = await collection.indexes();
    return indexes;
  } catch (error: any) {
    logError(`Error listing indexes for ${collectionName}`, error);
    return [];
  }
}
