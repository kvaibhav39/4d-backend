"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractSubdomain = extractSubdomain;
/**
 * Extracts subdomain from the request
 * Priority order:
 * 1. X-Subdomain header (for local development override)
 * 2. Host header (production: org1.example.com → org1)
 * 3. null if neither available
 *
 * @param req Express request object
 * @returns subdomain string or null
 */
function extractSubdomain(req) {
    // Priority 1: Check X-Subdomain header (for local dev override)
    const subdomainHeader = req.headers["x-subdomain"];
    if (subdomainHeader && typeof subdomainHeader === "string") {
        return subdomainHeader.trim().toLowerCase();
    }
    // Priority 2: Extract from Host header
    const host = req.headers.host;
    if (!host) {
        return null;
    }
    // Remove port number if present (e.g., "localhost:3000" → "localhost")
    const hostWithoutPort = host.split(":")[0];
    // Handle localhost and IP addresses (no subdomain)
    if (hostWithoutPort === "localhost" ||
        /^\d+\.\d+\.\d+\.\d+$/.test(hostWithoutPort)) {
        return null;
    }
    // Extract subdomain from host (e.g., "org1.example.com" → "org1")
    const parts = hostWithoutPort.split(".");
    if (parts.length >= 3) {
        // Multiple subdomains: take the first one (e.g., "app.org1.example.com" → "app")
        // Or if it's a standard domain with subdomain: "org1.example.com" → "org1"
        return parts[0].toLowerCase();
    }
    // Handle cases like "org1.localhost" for local development
    if (parts.length === 2 && parts[1] === "localhost") {
        return parts[0].toLowerCase();
    }
    // No subdomain detected
    return null;
}
