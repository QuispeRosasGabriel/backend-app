import express from "express";
import dotenv from "dotenv";
import cors, { CorsOptions } from "cors";
import { connectDB } from "./config/database";
import vehicleRoutes from "./routes/vehicleRoutes";
import brandRoutes from "./routes/brandRoutes";
import userRoutes from "./routes/userRoutes";

dotenv.config();
connectDB();

const app = express();

const allowedOrigins = ["http://localhost:3000", "https://yourdomain.com"];

const corsOptions: CorsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());

app.use("/api/user", userRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/brands", brandRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to the Car Sales API!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
