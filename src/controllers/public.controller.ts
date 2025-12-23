import { Request, Response } from "express";
import { PublicService } from "../services/public.service";

const publicService = new PublicService();

export class PublicController {
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
