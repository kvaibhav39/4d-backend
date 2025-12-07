"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Service = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const uuid_1 = require("uuid");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
});
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "";
class S3Service {
    /**
     * Upload a file to S3
     * @param file - File buffer from multer
     * @param orgId - Organization ID to organize files by organization
     * @param folder - Folder path in S3 (e.g., 'products')
     * @returns The S3 URL of the uploaded file
     */
    static async uploadFile(file, orgId, folder = "products") {
        if (!BUCKET_NAME) {
            throw new Error("AWS_S3_BUCKET_NAME is not configured");
        }
        // Generate unique filename with orgId in path
        const fileExtension = file.originalname.split(".").pop();
        const fileName = `${folder}/${orgId}/${(0, uuid_1.v4)()}.${fileExtension}`;
        const uploadParams = {
            Bucket: BUCKET_NAME,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
        };
        try {
            const command = new client_s3_1.PutObjectCommand(uploadParams);
            await s3Client.send(command);
            // Return the public URL
            const region = process.env.AWS_REGION || "us-east-1";
            const url = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${fileName}`;
            return url;
        }
        catch (error) {
            console.error("Error uploading file to S3:", error);
            throw new Error("Failed to upload file to S3");
        }
    }
    /**
     * Delete a file from S3
     * @param fileUrl - The S3 URL of the file to delete
     * @returns true if deletion succeeded, false otherwise (doesn't throw)
     */
    static async deleteFile(fileUrl) {
        if (!BUCKET_NAME) {
            console.warn("AWS_S3_BUCKET_NAME is not configured, skipping file deletion");
            return false;
        }
        try {
            // Extract the key from the URL
            // URL format: https://bucket-name.s3.region.amazonaws.com/key
            const urlParts = fileUrl.split(".amazonaws.com/");
            if (urlParts.length !== 2) {
                console.warn("Invalid S3 URL format for deletion:", fileUrl);
                return false;
            }
            const key = urlParts[1];
            const deleteParams = {
                Bucket: BUCKET_NAME,
                Key: key,
            };
            const command = new client_s3_1.DeleteObjectCommand(deleteParams);
            await s3Client.send(command);
            return true;
        }
        catch (error) {
            // Log warning instead of throwing - deletion failure shouldn't block the update
            if (error.Code === "AccessDenied" || error.name === "AccessDenied") {
                console.warn("S3 delete permission denied. The IAM user needs s3:DeleteObject permission. File may still exist:", fileUrl);
            }
            else {
                console.warn("Error deleting file from S3 (non-blocking):", error.message || error);
            }
            return false;
        }
    }
}
exports.S3Service = S3Service;
