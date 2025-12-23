"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicService = void 0;
class PublicService {
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
        console.log("Contact form submission:", data);
        return {
            success: true,
            message: "Thank you for your interest! We'll get back to you soon.",
        };
    }
}
exports.PublicService = PublicService;
