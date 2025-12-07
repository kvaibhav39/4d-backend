"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const Product_1 = require("../models/Product");
class ProductService {
    async listProducts(filters) {
        const { orgId, search, includeDeleted } = filters;
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
        const products = await Product_1.Product.find(query)
            .populate("categoryId")
            .sort({ createdAt: -1 });
        // Transform products to separate categoryId (string) and category (object)
        return products.map((product) => {
            const productObj = product.toObject();
            if (productObj.categoryId && typeof productObj.categoryId === "object") {
                productObj.category = productObj.categoryId;
                productObj.categoryId = productObj.categoryId._id.toString();
            }
            return productObj;
        });
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
}
exports.ProductService = ProductService;
