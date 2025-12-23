"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicController = void 0;
const public_service_1 = require("../services/public.service");
const publicService = new public_service_1.PublicService();
class PublicController {
    getFeatures(req, res) {
        try {
            const features = publicService.getFeatures();
            res.json(features);
        }
        catch (error) {
            console.error("Get features error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async submitContact(req, res) {
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
        }
        catch (error) {
            console.error("Submit contact error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
}
exports.PublicController = PublicController;
