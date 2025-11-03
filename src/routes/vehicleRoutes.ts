import express from "express";
import { createVehicle, getVehicles, getVehicleById } from "../controllers";

const router = express.Router();

router.post("/create-vehicle", createVehicle);
router.get("/get-vehicle-by-id", getVehicleById);
router.get("/get-all-vehicles", getVehicles);

export default router;
