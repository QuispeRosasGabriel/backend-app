import mongoose from "mongoose";
import { BrandModel } from "../models/BrandModel";

const seedData = [
  { brand: "Audi", models: ["A1", "A3", "A4", "A6", "Q5", "Q7"] },
  { brand: "Bentley", models: ["Continental GT", "Flying Spur", "Bentayga"] },
  { brand: "BMW", models: ["X1", "X3", "X5", "Series 3", "Series 5"] },
  { brand: "Ford", models: ["Fiesta", "Focus", "Mustang", "Ranger"] },
  { brand: "Honda", models: ["Civic", "Accord", "CR-V", "HR-V"] },
  { brand: "Mercedes", models: ["A-Class", "C-Class", "E-Class", "GLC"] },
];

mongoose.connect(process.env.MONGO_URI!).then(async () => {
  await BrandModel.deleteMany();
  await BrandModel.insertMany(seedData);
  console.log("✅ Brands and models seeded");
  process.exit();
});
