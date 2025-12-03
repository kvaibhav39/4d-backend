import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { ProductService } from "../services/product.service";
import { S3Service } from "../services/s3.service";

const productService = new ProductService();

export class ProductController {
  async listProducts(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId;
      const search = req.query.search as string | undefined;
      const includeDeleted = req.query.includeDeleted === "true";

      const products = await productService.listProducts({
        orgId,
        search,
        includeDeleted,
      });
      res.json(products);
    } catch (error) {
      console.error("List products error", error);
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
      console.error("Get product error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async createProduct(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId;
      const { title, description, code, categoryId, defaultRent, color, size } =
        req.body;
      const file = req.file;

      let imageUrl: string | undefined;

      // Upload image to S3 if file is provided
      if (file) {
        try {
          imageUrl = await S3Service.uploadFile(file, orgId, "products");
        } catch (uploadError: any) {
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
    } catch (error: any) {
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
      console.error("Update product error", error);
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
      console.error("Delete product error", error);
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
      console.error("Restore product error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}
