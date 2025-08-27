import bcrypt from "bcryptjs";
import { User } from "./models/User.js";
import { Config } from "./models/Config.js";

export async function seedAdminAndConfig() {
  const count = await User.countDocuments();
  if (count === 0) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    await User.create({
      fullName: "Admin",
      email: "admin@modvice.com",
      passwordHash,
      role: "Admin",
      active: true
    });
    console.log("✓ Seeded Admin: admin@modvice.com / admin123");
  }
  const cfg = await Config.findOne();
  if (!cfg) {
    await Config.create({ defaultThreshold: 5 });
    console.log("✓ Seeded Config (defaultThreshold=5)");
  }
}
