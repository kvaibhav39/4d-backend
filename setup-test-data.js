const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/4dcholi";

// Define schemas (simplified for setup script)
const OrganizationSchema = new mongoose.Schema({}, { strict: false });
const UserSchema = new mongoose.Schema({}, { strict: false });

const Organization = mongoose.model("Organization", OrganizationSchema);
const User = mongoose.model("User", UserSchema);

async function setupTestData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Check if org already exists
    let org = await Organization.findOne({ code: "4DCHOLI" });
    if (!org) {
      org = await Organization.create({
        name: "4D Choli",
        code: "4DCHOLI",
        subdomain: "4dcholi",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log("✅ Created organization:", org.name);
    } else {
      // Update existing org to add subdomain if it doesn't have one
      if (!org.subdomain) {
        org.subdomain = "4dcholi";
        await org.save();
        console.log("✅ Updated organization with subdomain:", org.name);
      } else {
        console.log("✅ Organization already exists:", org.name);
      }
    }

    // Check if user already exists
    let user = await User.findOne({ email: "admin@4dcholi.com" });
    if (!user) {
      const passwordHash = await bcrypt.hash("admin123", 10);
      user = await User.create({
        orgId: org._id,
        name: "Admin User",
        email: "admin@4dcholi.com",
        passwordHash: passwordHash,
        role: "admin",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log("✅ Created user: admin@4dcholi.com (password: admin123)");
    } else {
      console.log("✅ User already exists: admin@4dcholi.com");
    }

    console.log("\n✅ Test data setup complete!");
    console.log("Login credentials:");
    console.log("  Email: admin@4dcholi.com");
    console.log("  Password: admin123");

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error setting up test data:", error);
    process.exit(1);
  }
}

setupTestData();
