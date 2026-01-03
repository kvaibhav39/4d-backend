import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { ProductService } from "../services/product.service";
import { S3Service } from "../services/s3.service";
import { logError } from "../utils/logger";

const productService = new ProductService();

export class ProductController {
  async listProducts(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId;
      const search = req.query.search as string | undefined;
      const includeDeleted = req.query.includeDeleted === "true";
      const page = req.query.page
        ? parseInt(req.query.page as string, 10)
        : undefined;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : undefined;

      const result = await productService.listProducts({
        orgId,
        search,
        includeDeleted,
        page,
        limit,
      });
      res.json(result);
    } catch (error) {
      logError("List products error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getProduct(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId;
      const { id } = req.params;

      const product = await productService.getProductById(id, orgId);
      res.json(product);
    } catch (error: any) {
      if (error.message === "Product not found") {
        return res.status(404).json({ message: error.message });
      }
      logError("Get product error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async createProduct(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId;
      const {
        title,
        description,
        code,
        categoryId,
        defaultRent,
        color,
        size,
        featuredOrder,
      } = req.body;
      const file = req.file;

      let imageUrl: string | undefined;

      // Upload image to S3 if file is provided
      if (file) {
        try {
          imageUrl = await S3Service.uploadFile(file, orgId, "products");
        } catch (uploadError: any) {
          logError("Image upload error", uploadError);
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
        featuredOrder: featuredOrder ? parseInt(featuredOrder) : undefined,
      });

      res.status(201).json(product);
    } catch (error: any) {
      if (error.message === "Product code already exists") {
        return res.status(400).json({ message: error.message });
      }
      if (error.code === 11000) {
        return res.status(400).json({ message: "Product code already exists" });
      }
      logError("Create product error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async updateProduct(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId;
      const { id } = req.params;
      const {
        title,
        description,
        code,
        categoryId,
        defaultRent,
        color,
        size,
        isActive,
        featuredOrder,
      } = req.body;
      const file = req.file;

      // Get existing product to check for old image
      const existingProduct = await productService.getProductById(id, orgId);
      let imageUrl: string | undefined = existingProduct.imageUrl;

      // Upload new image to S3 if file is provided
      if (file) {
        try {
          // Delete old image from S3 if it exists (non-blocking)
          if (existingProduct.imageUrl) {
            await S3Service.deleteFile(existingProduct.imageUrl);
            // Note: Deletion failure doesn't block the update - old file may remain in S3
          }

          // Upload new image
          imageUrl = await S3Service.uploadFile(file, orgId, "products");
        } catch (uploadError: any) {
          logError("Image upload error", uploadError);
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
        featuredOrder:
          featuredOrder !== undefined
            ? featuredOrder === "" || featuredOrder === null
              ? null
              : parseInt(featuredOrder)
            : undefined,
      });

      res.json(product);
    } catch (error: any) {
      if (error.message === "Product not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Product code already exists") {
        return res.status(400).json({ message: error.message });
      }
      if (error.code === 11000) {
        return res.status(400).json({ message: "Product code already exists" });
      }
      logError("Update product error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async deleteProduct(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId;
      const { id } = req.params;

      const result = await productService.deleteProduct(id, orgId);
      res.json(result);
    } catch (error: any) {
      if (error.message === "Product not found") {
        return res.status(404).json({ message: error.message });
      }
      logError("Delete product error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async restoreProduct(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId;
      const { id } = req.params;

      const result = await productService.restoreProduct(id, orgId);
      res.json(result);
    } catch (error: any) {
      if (error.message === "Product not found") {
        return res.status(404).json({ message: error.message });
      }
      logError("Restore product error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getProductBookings(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId;
      const { id } = req.params;
      const filterDate = req.query.filterDate as string | undefined;

      const bookings = await productService.getProductBookings(
        id,
        orgId,
        filterDate
      );
      res.json(bookings);
    } catch (error: any) {
      if (error.message === "Product not found") {
        return res.status(404).json({ message: error.message });
      }
      logError("Get product bookings error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async bulkUpdateProductOrder(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId;
      const { updates } = req.body;

      if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({
          message: "Updates array is required and must not be empty",
        });
      }

      const result = await productService.bulkUpdateProductOrder(orgId, updates);
      res.json(result);
    } catch (error: any) {
      if (error.message === "Some products not found or don't belong to organization") {
        return res.status(400).json({ message: error.message });
      }
      logError("Bulk update product order error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}
