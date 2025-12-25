"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const Product_1 = require("../models/Product");
const Booking_1 = require("../models/Booking");
const pagination_1 = require("../types/pagination");
class ProductService {
    async listProducts(filters) {
        const { orgId, search, includeDeleted, page: rawPage, limit: rawLimit } = filters;
        // Validate and set pagination params
        const { page, limit } = pagination_1.PaginationHelper.validateParams(rawPage, rawLimit);
        const skip = pagination_1.PaginationHelper.getSkip(page, limit);
        // Build query
        const query = { orgId };
        // Only filter by isActive if we don't want to include deleted items
        if (!includeDeleted) {
            query.isActive = { $ne: false };
        }
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { code: { $regex: search, $options: "i" } },
            ];
        }
        // Execute count and find in parallel for better performance
        const [total, products] = await Promise.all([
            Product_1.Product.countDocuments(query),
            Product_1.Product.find(query)
                .populate("categoryId")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean() // Use lean() for better performance since we're transforming anyway
        ]);
        // Transform products to separate categoryId (string) and category (object)
        const transformedProducts = products.map((product) => {
            if (product.categoryId && typeof product.categoryId === "object") {
                product.category = product.categoryId;
                product.categoryId = product.categoryId._id.toString();
            }
            return product;
        });
        const pagination = pagination_1.PaginationHelper.getMeta(page, limit, total);
        return {
            data: transformedProducts,
            pagination,
        };
    }
    async getProductById(id, orgId) {
        const product = await Product_1.Product.findOne({
            _id: id,
            orgId,
            isActive: { $ne: false },
        }).populate("categoryId");
        if (!product) {
            throw new Error("Product not found");
        }
        // Transform product to separate categoryId (string) and category (object)
        const productObj = product.toObject();
        if (productObj.categoryId && typeof productObj.categoryId === "object") {
            productObj.category = productObj.categoryId;
            productObj.categoryId = productObj.categoryId._id.toString();
        }
        return productObj;
    }
    async createProduct(data) {
        const { orgId, title, description, code, categoryId, defaultRent, color, size, imageUrl, } = data;
        // Check if product with same code exists
        const existing = await Product_1.Product.findOne({
            orgId,
            code,
            isActive: { $ne: false },
        });
        if (existing) {
            throw new Error("Product code already exists");
        }
        const product = await Product_1.Product.create({
            orgId,
            title,
            description,
            code,
            categoryId: categoryId || undefined,
            defaultRent,
            color,
            size,
            imageUrl,
        });
        const populatedProduct = await Product_1.Product.findById(product._id).populate("categoryId");
        if (!populatedProduct)
            throw new Error("Failed to create product");
        // Transform product to separate categoryId (string) and category (object)
        const productObj = populatedProduct.toObject();
        if (productObj.categoryId && typeof productObj.categoryId === "object") {
            productObj.category = productObj.categoryId;
            productObj.categoryId = productObj.categoryId._id.toString();
        }
        return productObj;
    }
    async updateProduct(id, orgId, data) {
        const product = await Product_1.Product.findOne({ _id: id, orgId });
        if (!product) {
            throw new Error("Product not found");
        }
        // Check if code is being updated and if it conflicts with existing product
        if (data.code && data.code !== product.code) {
            const existing = await Product_1.Product.findOne({
                orgId,
                code: data.code,
                isActive: { $ne: false },
                _id: { $ne: id },
            });
            if (existing) {
                throw new Error("Product code already exists");
            }
        }
        const updateData = {};
        if (data.title !== undefined)
            updateData.title = data.title;
        if (data.description !== undefined)
            updateData.description = data.description;
        if (data.code !== undefined)
            updateData.code = data.code;
        if (data.defaultRent !== undefined)
            updateData.defaultRent = data.defaultRent;
        if (data.color !== undefined)
            updateData.color = data.color;
        if (data.size !== undefined)
            updateData.size = data.size;
        if (data.imageUrl !== undefined)
            updateData.imageUrl = data.imageUrl;
        if (data.isActive !== undefined)
            updateData.isActive = data.isActive;
        if (data.categoryId !== undefined) {
            updateData.categoryId = data.categoryId || null;
        }
        const updated = await Product_1.Product.findOneAndUpdate({ _id: id, orgId }, { $set: updateData }, { new: true }).populate("categoryId");
        if (!updated)
            throw new Error("Product not found");
        // Transform product to separate categoryId (string) and category (object)
        const productObj = updated.toObject();
        if (productObj.categoryId && typeof productObj.categoryId === "object") {
            productObj.category = productObj.categoryId;
            productObj.categoryId = productObj.categoryId._id.toString();
        }
        return productObj;
    }
    async deleteProduct(id, orgId) {
        const product = await Product_1.Product.findOneAndUpdate({ _id: id, orgId }, { isActive: false }, { new: true });
        if (!product) {
            throw new Error("Product not found");
        }
        return { message: "Product deactivated" };
    }
    async restoreProduct(id, orgId) {
        const product = await Product_1.Product.findOneAndUpdate({ _id: id, orgId }, { isActive: true }, { new: true });
        if (!product) {
            throw new Error("Product not found");
        }
        return { message: "Product restored" };
    }
    async getProductBookings(productId, orgId, filterDate) {
        // Verify product exists and belongs to org
        const product = await Product_1.Product.findOne({
            _id: productId,
            orgId,
        });
        if (!product) {
            throw new Error("Product not found");
        }
        // Build query for bookings
        const query = {
            orgId,
            productId,
        };
        // If filterDate is provided, filter bookings where:
        // - fromDateTime matches the filter date
        // - toDateTime matches the filter date
        // - OR the filter date is between fromDateTime and toDateTime
        if (filterDate) {
            const filterDateObj = new Date(filterDate);
            const filterDateStart = new Date(filterDateObj);
            filterDateStart.setHours(0, 0, 0, 0);
            const filterDateEnd = new Date(filterDateObj);
            filterDateEnd.setHours(23, 59, 59, 999);
            query.$or = [
                // fromDateTime matches the filter date
                {
                    fromDateTime: {
                        $gte: filterDateStart,
                        $lte: filterDateEnd,
                    },
                },
                // toDateTime matches the filter date
                {
                    toDateTime: {
                        $gte: filterDateStart,
                        $lte: filterDateEnd,
                    },
                },
                // filter date is between fromDateTime and toDateTime
                {
                    fromDateTime: { $lte: filterDateEnd },
                    toDateTime: { $gte: filterDateStart },
                },
            ];
        }
        // Get bookings sorted by fromDateTime in descending order
        const bookings = await Booking_1.Booking.find(query)
            .populate("productId")
            .populate("categoryId")
            .populate("orderId", "customerName customerPhone status")
            .sort({ fromDateTime: -1 });
        // Transform bookings to match frontend format
        return bookings.map((booking) => {
            const bookingObj = booking.toObject();
            // Transform productId
            if (bookingObj.productId && typeof bookingObj.productId === "object") {
                bookingObj.product = bookingObj.productId;
                bookingObj.productId = bookingObj.productId._id.toString();
            }
            // Transform categoryId
            if (bookingObj.categoryId && typeof bookingObj.categoryId === "object") {
                bookingObj.category = bookingObj.categoryId;
                bookingObj.categoryId = bookingObj.categoryId._id.toString();
            }
            // Transform orderId
            if (bookingObj.orderId && typeof bookingObj.orderId === "object") {
                bookingObj.order = bookingObj.orderId;
                bookingObj.orderId = bookingObj.orderId._id.toString();
            }
            return bookingObj;
        });
    }
}
exports.ProductService = ProductService;
