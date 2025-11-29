"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const product_service_1 = require("../services/product.service");
const productService = new product_service_1.ProductService();
class ProductController {
    async listProducts(req, res) {
        try {
            const orgId = req.user.orgId;
            const search = req.query.search;
            const products = await productService.listProducts({ orgId, search });
            res.json(products);
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
            const product = await productService.createProduct({
                orgId,
                title,
                description,
                code,
                categoryId,
                defaultRent,
                color,
                size,
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
            const { title, description, code, categoryId, defaultRent, color, size, isActive } = req.body;
            const product = await productService.updateProduct(id, orgId, {
                title,
                description,
                code,
                categoryId,
                defaultRent,
                color,
                size,
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
}
exports.ProductController = ProductController;
