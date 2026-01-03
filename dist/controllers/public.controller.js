"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicController = void 0;
const public_service_1 = require("../services/public.service");
const logger_1 = require("../utils/logger");
const publicService = new public_service_1.PublicService();
class PublicController {
    async getOrg(req, res) {
        try {
            const org = await publicService.getOrgBySubdomain(req);
            res.json(org);
        }
        catch (error) {
            if (error.message === "Subdomain is required" ||
                error.message === "Organization not found") {
                return res.status(404).json({ message: error.message });
            }
            (0, logger_1.logError)("Get org error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async getProducts(req, res) {
        try {
            const products = await publicService.getPublicProducts(req);
            res.json(products);
        }
        catch (error) {
            if (error.message === "Subdomain is required" ||
                error.message === "Organization not found") {
                return res.status(404).json({ message: error.message });
            }
            (0, logger_1.logError)("Get public products error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async getCategories(req, res) {
        try {
            const categories = await publicService.getPublicCategories(req);
            res.json(categories);
        }
        catch (error) {
            if (error.message === "Subdomain is required" ||
                error.message === "Organization not found") {
                return res.status(404).json({ message: error.message });
            }
            (0, logger_1.logError)("Get public categories error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    getFeatures(req, res) {
        try {
            const features = publicService.getFeatures();
            res.json(features);
        }
        catch (error) {
            (0, logger_1.logError)("Get features error", error);
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
            (0, logger_1.logError)("Submit contact error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
}
exports.PublicController = PublicController;
