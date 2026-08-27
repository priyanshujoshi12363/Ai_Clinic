// routes/doctorRoutes.js
import express from "express";
import {
  registerDoctor,
  loginDoctor,
  getDoctorProfile,
  updateDoctorProfile,
  changePassword,
  logoutDoctor,
  getAllDoctors,
  getDoctorById
} from "../Controller/DoctorController.js";
import { protect, authorize } from "../Middleware/drProtect.js";

const router = express.Router();

router.post("/register", registerDoctor);
router.post("/login", loginDoctor);

router.use(protect);

router.get("/profile", getDoctorProfile);
router.put("/profile", updateDoctorProfile);
router.put("/change-password", changePassword);
router.post("/logout", logoutDoctor);

router.get("/", authorize("ADMIN"), getAllDoctors);
router.get("/:doctorId", authorize("ADMIN"), getDoctorById);

export default router;