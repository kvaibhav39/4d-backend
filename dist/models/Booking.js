"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Booking = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PaymentSchema = new mongoose_1.Schema({
    type: { type: String, enum: ["ADVANCE", "RENT_REMAINING", "REFUND"], required: true },
    amount: { type: Number, required: true },
    at: { type: Date, required: true, default: Date.now },
    note: { type: String },
}, { _id: false });
const BookingSchema = new mongoose_1.Schema({
    orgId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Organization", required: true },
    productId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Product", required: true },
    categoryId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Category" },
    customerName: { type: String, required: true },
    customerPhone: { type: String },
    fromDateTime: { type: Date, required: true },
    toDateTime: { type: Date, required: true },
    productDefaultRent: { type: Number, required: true },
    decidedRent: { type: Number, required: true },
    advanceAmount: { type: Number, required: true },
    remainingAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ["BOOKED", "ISSUED", "RETURNED", "CANCELLED"],
        default: "BOOKED",
    },
    isConflictOverridden: { type: Boolean, default: false },
    additionalItemsDescription: { type: String },
    payments: { type: [PaymentSchema], default: [] },
}, { timestamps: true });
BookingSchema.index({ orgId: 1, productId: 1, fromDateTime: 1, toDateTime: 1 });
exports.Booking = mongoose_1.default.model("Booking", BookingSchema);
