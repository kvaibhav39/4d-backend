import { Request, Response } from "express";
import { PublicService } from "../services/public.service";

const publicService = new PublicService();

export class PublicController {
  async getOrg(req: Request, res: Response) {
    try {
      const org = await publicService.getOrgBySubdomain(req);
      res.json(org);
    } catch (error: any) {
      if (
        error.message === "Subdomain is required" ||
        error.message === "Organization not found"
      ) {
        return res.status(404).json({ message: error.message });
      }
      console.error("Get org error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getProducts(req: Request, res: Response) {
    try {
      const products = await publicService.getPublicProducts(req);
      res.json(products);
    } catch (error: any) {
      if (
        error.message === "Subdomain is required" ||
        error.message === "Organization not found"
      ) {
        return res.status(404).json({ message: error.message });
      }
      console.error("Get public products error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getCategories(req: Request, res: Response) {
    try {
      const categories = await publicService.getPublicCategories(req);
      res.json(categories);
    } catch (error: any) {
      if (
        error.message === "Subdomain is required" ||
        error.message === "Organization not found"
      ) {
        return res.status(404).json({ message: error.message });
      }
      console.error("Get public categories error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  getFeatures(req: Request, res: Response) {
    try {
      const features = publicService.getFeatures();
      res.json(features);
    } catch (error) {
      console.error("Get features error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async submitContact(req: Request, res: Response) {
    try {
      const { name, email, company, phone, message } = req.body;

      const result = await publicService.submitContact({
        name,
        email,
        company,
        phone,
        message,
      });

      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      res.json({ message: result.message });
    } catch (error) {
      console.error("Submit contact error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}
