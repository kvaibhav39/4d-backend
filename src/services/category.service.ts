import mongoose from "mongoose";
import { Category } from "../models/Category";

export interface CreateCategoryData {
  orgId: string;
  name: string;
  description?: string;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface ListCategoriesFilters {
  orgId: string;
  search?: string;
}

export class CategoryService {
  async listCategories(filters: ListCategoriesFilters) {
    const { orgId, search } = filters;
    const query: any = { orgId, isActive: { $ne: false } };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    return await Category.find(query).sort({ name: 1 });
  }

  async getCategoryById(id: string, orgId: string) {
    const category = await Category.findOne({
      _id: id,
      orgId,
      isActive: { $ne: false },
    });

    if (!category) {
      throw new Error("Category not found");
    }

    return category;
  }

  async createCategory(data: CreateCategoryData) {
    const { orgId, name, description } = data;

    // Check if category with same name exists
    const existing = await Category.findOne({ orgId, name, isActive: { $ne: false } });
    if (existing) {
      throw new Error("Category name already exists");
    }

    const category = await Category.create({
      orgId,
      name,
      description,
    });

    return category;
  }

  async updateCategory(id: string, orgId: string, data: UpdateCategoryData) {
    const category = await Category.findOne({ _id: id, orgId });
    if (!category) {
      throw new Error("Category not found");
    }

    // Check if name is being updated and if it conflicts with existing category
    if (data.name && data.name !== category.name) {
      const existing = await Category.findOne({
        orgId,
        name: data.name,
        isActive: { $ne: false },
        _id: { $ne: id },
      });
      if (existing) {
        throw new Error("Category name already exists");
      }
    }

    const updated = await Category.findOneAndUpdate(
      { _id: id, orgId },
      { $set: data },
      { new: true }
    );

    return updated!;
  }

  async deleteCategory(id: string, orgId: string) {
    const category = await Category.findOneAndUpdate(
      { _id: id, orgId },
      { isActive: false },
      { new: true }
    );

    if (!category) {
      throw new Error("Category not found");
    }

    return { message: "Category deactivated" };
  }
}

