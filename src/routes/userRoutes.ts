import express from "express";
import { createUser, getUsers, getUserById } from "../controllers";
import { forgotPasswordUser, loginUser, logoutUser, resetPasswordUser } from "../controllers/authController";
import { verifyToken } from "../middleware/authMiddleware";

const router = express.Router();
router.post("/login", loginUser);
router.post("/forgot-password", forgotPasswordUser);
router.post("/reset-password/:token", resetPasswordUser);
router.post("/create-user", createUser);
router.use(verifyToken as any);

/* router.get("/profile", (req, res) => {
  res.json({ message: "Access granted", user: (req as any).user });
}); */

router.post("/logout",logoutUser)
router.get("/get-user-by-id", getUserById);
router.get("/get-all-users", getUsers);

export default router;
