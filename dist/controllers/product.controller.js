"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const product_service_1 = require("../services/product.service");
const s3_service_1 = require("../services/s3.service");
const productService = new product_service_1.ProductService();
class ProductController {
    async listProducts(req, res) {
        try {
            const orgId = req.user.orgId;
            const search = req.query.search;
            const includeDeleted = req.query.includeDeleted === "true";
            const page = req.query.page ? parseInt(req.query.page, 10) : undefined;
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
            const result = await productService.listProducts({
                orgId,
                search,
                includeDeleted,
                page,
                limit,
            });
            res.json(result);
        }
        catch (error) {
            console.error("List products error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async getProduct(req, res) {
        try {
            const orgId = req.user.orgId;
            const { id } = req.params;
            const product = await productService.getProductById(id, orgId);
            res.json(product);
        }
        catch (error) {
            if (error.message === "Product not found") {
                return res.status(404).json({ message: error.message });
            }
            console.error("Get product error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async createProduct(req, res) {
        try {
            const orgId = req.user.orgId;
            const { title, description, code, categoryId, defaultRent, color, size } = req.body;
            const file = req.file;
            let imageUrl;
            // Upload image to S3 if file is provided
            if (file) {
                try {
                    imageUrl = await s3_service_1.S3Service.uploadFile(file, orgId, "products");
                }
                catch (uploadError) {
                    console.error("Image upload error:", uploadError);
                    return res.status(500).json({
                        message: "Failed to upload image",
                        error: uploadError.message,
                    });
                }
            }
            const product = await productService.createProduct({
                orgId,
                title,
                description,
                code,
                categoryId,
                defaultRent,
                color,
                size,
                imageUrl,
            });
            res.status(201).json(product);
        }
        catch (error) {
            if (error.message === "Product code already exists") {
                return res.status(400).json({ message: error.message });
            }
            if (error.code === 11000) {
                return res.status(400).json({ message: "Product code already exists" });
            }
            console.error("Create product error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async updateProduct(req, res) {
        try {
            const orgId = req.user.orgId;
            const { id } = req.params;
            const { title, description, code, categoryId, defaultRent, color, size, isActive, } = req.body;
            const file = req.file;
            // Get existing product to check for old image
            const existingProduct = await productService.getProductById(id, orgId);
            let imageUrl = existingProduct.imageUrl;
            // Upload new image to S3 if file is provided
            if (file) {
                try {
                    // Delete old image from S3 if it exists (non-blocking)
                    if (existingProduct.imageUrl) {
                        await s3_service_1.S3Service.deleteFile(existingProduct.imageUrl);
                        // Note: Deletion failure doesn't block the update - old file may remain in S3
                    }
                    // Upload new image
                    imageUrl = await s3_service_1.S3Service.uploadFile(file, orgId, "products");
                }
                catch (uploadError) {
                    console.error("Image upload error:", uploadError);
                    return res.status(500).json({
                        message: "Failed to upload image",
                        error: uploadError.message,
                    });
                }
            }
            const product = await productService.updateProduct(id, orgId, {
                title,
                description,
                code,
                categoryId,
                defaultRent,
                color,
                size,
                imageUrl,
                isActive,
            });
            res.json(product);
        }
        catch (error) {
            if (error.message === "Product not found") {
                return res.status(404).json({ message: error.message });
            }
            if (error.message === "Product code already exists") {
                return res.status(400).json({ message: error.message });
            }
            if (error.code === 11000) {
                return res.status(400).json({ message: "Product code already exists" });
            }
            console.error("Update product error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async deleteProduct(req, res) {
        try {
            const orgId = req.user.orgId;
            const { id } = req.params;
            const result = await productService.deleteProduct(id, orgId);
            res.json(result);
        }
        catch (error) {
            if (error.message === "Product not found") {
                return res.status(404).json({ message: error.message });
            }
            console.error("Delete product error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async restoreProduct(req, res) {
        try {
            const orgId = req.user.orgId;
            const { id } = req.params;
            const result = await productService.restoreProduct(id, orgId);
            res.json(result);
        }
        catch (error) {
            if (error.message === "Product not found") {
                return res.status(404).json({ message: error.message });
            }
            console.error("Restore product error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async getProductBookings(req, res) {
        try {
            const orgId = req.user.orgId;
            const { id } = req.params;
            const filterDate = req.query.filterDate;
            const bookings = await productService.getProductBookings(id, orgId, filterDate);
            res.json(bookings);
        }
        catch (error) {
            if (error.message === "Product not found") {
                return res.status(404).json({ message: error.message });
            }
            console.error("Get product bookings error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
}
exports.ProductController = ProductController;
