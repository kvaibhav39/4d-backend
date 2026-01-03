"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const category_service_1 = require("../services/category.service");
const errorLogger_1 = require("../utils/errorLogger");
const categoryService = new category_service_1.CategoryService();
class CategoryController {
    async listCategories(req, res) {
        try {
            const orgId = req.user.orgId;
            const search = req.query.search;
            const includeDeleted = req.query.includeDeleted === "true";
            const categories = await categoryService.listCategories({
                orgId,
                search,
                includeDeleted,
            });
            res.json(categories);
        }
        catch (error) {
            (0, errorLogger_1.logError)("List categories error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async getCategory(req, res) {
        try {
            const orgId = req.user.orgId;
            const { id } = req.params;
            const category = await categoryService.getCategoryById(id, orgId);
            res.json(category);
        }
        catch (error) {
            if (error.message === "Category not found") {
                return res.status(404).json({ message: error.message });
            }
            (0, errorLogger_1.logError)("Get category error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async createCategory(req, res) {
        try {
            const orgId = req.user.orgId;
            const { name, description } = req.body;
            const category = await categoryService.createCategory({
                orgId,
                name,
                description,
            });
            res.status(201).json(category);
        }
        catch (error) {
            if (error.message === "Category name already exists") {
                return res.status(400).json({ message: error.message });
            }
            if (error.code === 11000) {
                return res
                    .status(400)
                    .json({ message: "Category name already exists" });
            }
            (0, errorLogger_1.logError)("Create category error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async updateCategory(req, res) {
        try {
            const orgId = req.user.orgId;
            const { id } = req.params;
            const { name, description, isActive } = req.body;
            const category = await categoryService.updateCategory(id, orgId, {
                name,
                description,
                isActive,
            });
            res.json(category);
        }
        catch (error) {
            if (error.message === "Category not found") {
                return res.status(404).json({ message: error.message });
            }
            if (error.message === "Category name already exists") {
                return res.status(400).json({ message: error.message });
            }
            if (error.code === 11000) {
                return res
                    .status(400)
                    .json({ message: "Category name already exists" });
            }
            (0, errorLogger_1.logError)("Update category error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async deleteCategory(req, res) {
        try {
            const orgId = req.user.orgId;
            const { id } = req.params;
            const result = await categoryService.deleteCategory(id, orgId);
            res.json(result);
        }
        catch (error) {
            if (error.message === "Category not found") {
                return res.status(404).json({ message: error.message });
            }
            (0, errorLogger_1.logError)("Delete category error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async restoreCategory(req, res) {
        try {
            const orgId = req.user.orgId;
            const { id } = req.params;
            const result = await categoryService.restoreCategory(id, orgId);
            res.json(result);
        }
        catch (error) {
            if (error.message === "Category not found") {
                return res.status(404).json({ message: error.message });
            }
            (0, errorLogger_1.logError)("Restore category error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
}
exports.CategoryController = CategoryController;
