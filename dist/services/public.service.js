"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicService = void 0;
const subdomain_1 = require("../utils/subdomain");
const Organization_1 = require("../models/Organization");
const Product_1 = require("../models/Product");
const Category_1 = require("../models/Category");
const logger_1 = require("../utils/logger");
class PublicService {
    async getOrgBySubdomain(req) {
        const subdomain = (0, subdomain_1.extractSubdomain)(req);
        if (!subdomain) {
            throw new Error("Subdomain is required");
        }
        const organization = await Organization_1.Organization.findOne({ subdomain });
        if (!organization) {
            throw new Error("Organization not found");
        }
        return {
            id: organization._id.toString(),
            name: organization.name,
            code: organization.code,
            subdomain: organization.subdomain,
            instagram: organization.instagram,
            facebook: organization.facebook,
            contact: organization.contact,
        };
    }
    async getPublicProducts(req) {
        const subdomain = (0, subdomain_1.extractSubdomain)(req);
        if (!subdomain) {
            throw new Error("Subdomain is required");
        }
        const organization = await Organization_1.Organization.findOne({ subdomain });
        if (!organization) {
            throw new Error("Organization not found");
        }
        // Get only active products
        const products = await Product_1.Product.find({
            orgId: organization._id,
            isActive: { $ne: false },
        })
            .populate("categoryId")
            .sort({ createdAt: -1 })
            .lean();
        // Transform products and filter only those with imageUrl
        const transformedProducts = products
            .filter((product) => product.imageUrl && product.imageUrl.trim() !== "")
            .map((product) => {
            const transformed = {
                id: product._id.toString(),
                title: product.title,
                description: product.description,
                code: product.code,
                defaultRent: product.defaultRent,
                color: product.color,
                size: product.size,
                imageUrl: product.imageUrl,
                featuredOrder: product.featuredOrder,
            };
            if (product.categoryId && typeof product.categoryId === "object") {
                transformed.category = {
                    id: product.categoryId._id.toString(),
                    name: product.categoryId.name,
                    description: product.categoryId.description,
                };
                transformed.categoryId = product.categoryId._id.toString();
            }
            return transformed;
        });
        // Separate featured and regular products
        // Only top 5 featured products (sorted by featuredOrder) with imageUrl
        const allFeatured = transformedProducts
            .filter((p) => p.featuredOrder != null)
            .sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0));
        const featuredProducts = allFeatured.slice(0, 5);
        // Get IDs of featured products to exclude from regular
        const featuredIds = new Set(featuredProducts.map((p) => p.id));
        // All other products (not in top 5 featured) are regular products
        const regularProducts = transformedProducts.filter((p) => !featuredIds.has(p.id));
        return {
            featured: featuredProducts,
            regular: regularProducts,
        };
    }
    async getPublicCategories(req) {
        const subdomain = (0, subdomain_1.extractSubdomain)(req);
        if (!subdomain) {
            throw new Error("Subdomain is required");
        }
        const organization = await Organization_1.Organization.findOne({ subdomain });
        if (!organization) {
            throw new Error("Organization not found");
        }
        // Get only active categories
        const categories = await Category_1.Category.find({
            orgId: organization._id,
            isActive: { $ne: false },
        })
            .sort({ name: 1 })
            .lean();
        return categories.map((category) => ({
            id: category._id.toString(),
            name: category.name,
            description: category.description,
        }));
    }
    getFeatures() {
        return {
            features: [
                {
                    id: "product-management",
                    title: "Product & Category Management",
                    description: "Efficiently organize your rental inventory with categories, codes, and detailed product information. Set default rental prices and manage product availability.",
                    icon: "📦",
                    category: "management",
                },
                {
                    id: "booking-management",
                    title: "Smart Booking Management",
                    description: "Create and manage bookings with flexible date/time selection. Track booking status from creation to return, with automatic conflict detection.",
                    icon: "📅",
                    category: "management",
                },
                {
                    id: "conflict-detection",
                    title: "Automatic Conflict Detection",
                    description: "Prevent double bookings with intelligent conflict detection. Get real-time warnings when products are already booked for overlapping time periods.",
                    icon: "⚠️",
                    category: "automation",
                },
                {
                    id: "payment-tracking",
                    title: "Comprehensive Payment Tracking",
                    description: "Track advance payments, remaining amounts, and refunds. Generate invoices and maintain complete payment history for each booking.",
                    icon: "💰",
                    category: "payments",
                },
                {
                    id: "order-management",
                    title: "Order Management",
                    description: "Manage customer orders with multiple bookings. Track order status, total amounts, and payment collections in one place.",
                    icon: "🛒",
                    category: "management",
                },
                {
                    id: "dashboard-analytics",
                    title: "Dashboard & Analytics",
                    description: "Get insights into your daily operations with real-time statistics, booking summaries, and revenue tracking.",
                    icon: "📊",
                    category: "analytics",
                },
                {
                    id: "flexible-pricing",
                    title: "Flexible Pricing",
                    description: "Set default rental prices per product while allowing custom pricing for individual bookings. Perfect for negotiations and special deals.",
                    icon: "💵",
                    category: "management",
                },
                {
                    id: "multi-organization",
                    title: "Multi-Organization Support",
                    description: "Built with multi-tenant architecture. Each organization has isolated data, perfect for SaaS deployment or managing multiple rental businesses.",
                    icon: "🏢",
                    category: "management",
                },
                {
                    id: "mobile-responsive",
                    title: "Mobile Responsive",
                    description: "Access your rental management system from any device. Fully responsive design works seamlessly on desktop, tablet, and mobile.",
                    icon: "📱",
                    category: "automation",
                },
            ],
            capabilities: {
                productManagement: true,
                bookingManagement: true,
                paymentTracking: true,
                conflictDetection: true,
                multiOrganization: true,
                mobileResponsive: true,
            },
            benefits: [
                "Streamline your rental operations and reduce manual errors",
                "Save time with automated conflict detection and booking management",
                "Improve cash flow with comprehensive payment tracking",
                "Make data-driven decisions with real-time analytics",
                "Scale your business with multi-organization support",
                "Access your system anywhere, anytime with mobile-responsive design",
                "Reduce booking conflicts and improve customer satisfaction",
                "Generate professional invoices and payment reports",
            ],
            pricing: [
                {
                    name: "Starter",
                    price: "₹2,999",
                    priceValue: 2999,
                    currency: "INR",
                    description: "Perfect for small rental businesses",
                    features: [
                        "Up to 100 products",
                        "Unlimited bookings",
                        "Payment tracking",
                        "Basic dashboard",
                        "Email support",
                    ],
                    popular: false,
                },
                {
                    name: "Professional",
                    price: "₹7,999",
                    priceValue: 7999,
                    currency: "INR",
                    description: "Ideal for growing rental companies",
                    features: [
                        "Unlimited products",
                        "Advanced booking management",
                        "Conflict detection",
                        "Analytics & reports",
                        "Priority support",
                        "Multi-organization support",
                    ],
                    popular: true,
                },
                {
                    name: "Enterprise",
                    price: "Custom",
                    priceValue: undefined,
                    currency: "INR",
                    description: "For large rental operations",
                    features: [
                        "Everything in Professional",
                        "Custom integrations",
                        "Dedicated account manager",
                        "Custom training",
                        "SLA guarantee",
                        "White-label options",
                    ],
                    popular: false,
                },
            ],
        };
    }
    async submitContact(data) {
        // In a real implementation, you would:
        // 1. Save to database
        // 2. Send email notification
        // 3. Integrate with CRM
        // For now, we'll just validate and return success
        if (!data.name || !data.email || !data.message) {
            return {
                success: false,
                message: "Name, email, and message are required",
            };
        }
        // TODO: Implement actual storage/email logic
        (0, logger_1.logInfo)("Contact form submission:", data);
        return {
            success: true,
            message: "Thank you for your interest! We'll get back to you soon.",
        };
    }
}
exports.PublicService = PublicService;
