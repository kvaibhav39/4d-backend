import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { ProductService } from "../services/product.service";

const productService = new ProductService();

export class ProductController {
  async listProducts(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId;
      const search = req.query.search as string | undefined;

      const products = await productService.listProducts({ orgId, search });
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
}

