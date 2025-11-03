import express from "express";
import {
  getAllBrands,
  getBrandModelHierarchy,
  getModelsByBrand,
} from "../controllers/brandController";

const router = express.Router();

router.get("/", getAllBrands);
router.get("/:brand/models", getModelsByBrand);
router.get("/with-models/from-vehicles", getBrandModelHierarchy);

export default router;
