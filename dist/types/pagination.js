"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginationHelper = void 0;
class PaginationHelper {
    static getSkip(page, limit) {
        return (page - 1) * limit;
    }
    static getMeta(page, limit, total) {
        const totalPages = Math.ceil(total / limit);
        return {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        };
    }
    static validateParams(page, limit) {
        const validatedPage = Math.max(1, page || 1);
        const validatedLimit = Math.min(100, Math.max(1, limit || 20)); // Max 100 items per page
        return { page: validatedPage, limit: validatedLimit };
    }
}
exports.PaginationHelper = PaginationHelper;
