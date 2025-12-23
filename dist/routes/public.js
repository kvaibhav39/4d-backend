"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const public_controller_1 = require("../controllers/public.controller");
const router = (0, express_1.Router)();
const publicController = new public_controller_1.PublicController();
// Public routes - no authentication required
router.get("/features", (req, res) => publicController.getFeatures(req, res));
router.post("/contact", (req, res) => publicController.submitContact(req, res));
exports.default = router;
