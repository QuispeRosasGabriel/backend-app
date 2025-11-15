import express from "express";
import { createVehicle, getVehicles, getVehicleById, getVehiclesByUserId, getFilteredVehicles, updateVehicle, softDeleteVehicle, restoreVehicle, markVehicleAsSold } from "../controllers";

const router = express.Router();

router.post("/create-vehicle", createVehicle);
router.put("/update-vehicle/:id", updateVehicle);
router.put("/delete/:id", softDeleteVehicle);
router.put("/mark-sold/:id", markVehicleAsSold);
router.put("/restore/:id", restoreVehicle);

router.get("/get-vehicle-by-id/:id", getVehicleById);
router.get("/get-all-vehicles", getVehicles);
router.get("/user/:userId", getVehiclesByUserId);
router.get("/filter", getFilteredVehicles);

export default router;
