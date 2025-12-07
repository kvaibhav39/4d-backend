"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const Category_1 = require("../models/Category");
class CategoryService {
    async listCategories(filters) {
        const { orgId, search, includeDeleted } = filters;
        const query = { orgId };
        // Only filter by isActive if we don't want to include deleted items
        if (!includeDeleted) {
            query.isActive = { $ne: false };
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }
        return await Category_1.Category.find(query).sort({ name: 1 });
    }
    async getCategoryById(id, orgId) {
        const category = await Category_1.Category.findOne({
            _id: id,
            orgId,
            isActive: { $ne: false },
        });
        if (!category) {
            throw new Error("Category not found");
        }
        return category;
    }
    async createCategory(data) {
        const { orgId, name, description } = data;
        // Check if category with same name exists
        const existing = await Category_1.Category.findOne({ orgId, name, isActive: { $ne: false } });
        if (existing) {
            throw new Error("Category name already exists");
        }
        const category = await Category_1.Category.create({
            orgId,
            name,
            description,
        });
        return category;
    }
    async updateCategory(id, orgId, data) {
        const category = await Category_1.Category.findOne({ _id: id, orgId });
        if (!category) {
            throw new Error("Category not found");
        }
        // Check if name is being updated and if it conflicts with existing category
        if (data.name && data.name !== category.name) {
            const existing = await Category_1.Category.findOne({
                orgId,
                name: data.name,
                isActive: { $ne: false },
                _id: { $ne: id },
            });
            if (existing) {
                throw new Error("Category name already exists");
            }
        }
        const updated = await Category_1.Category.findOneAndUpdate({ _id: id, orgId }, { $set: data }, { new: true });
        return updated;
    }
    async deleteCategory(id, orgId) {
        const category = await Category_1.Category.findOneAndUpdate({ _id: id, orgId }, { isActive: false }, { new: true });
        if (!category) {
            throw new Error("Category not found");
        }
        return { message: "Category deactivated" };
    }
    async restoreCategory(id, orgId) {
        const category = await Category_1.Category.findOneAndUpdate({ _id: id, orgId }, { isActive: true }, { new: true });
        if (!category) {
            throw new Error("Category not found");
        }
        return { message: "Category restored" };
    }
}
exports.CategoryService = CategoryService;
