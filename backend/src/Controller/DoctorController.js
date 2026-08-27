// controllers/doctorController.js
import bcrypt from "bcryptjs";
import Doctor from "../Models/Doctor.model.js";
import { generateToken } from "../Middleware/drProtect.js";

export const registerDoctor = async (req, res) => {
  try {
    const {
      doctorId,
      name,
      registrationNumber,
      specialization,
      hospital,
      contact,
      consultation,
      account
    } = req.body;

    const existingDoctor = await Doctor.findOne({
      $or: [
        { doctorId: doctorId },
        { registrationNumber: registrationNumber },
        { "contact.email": contact.email },
        { "account.username": account.username }
      ]
    });

    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: "Doctor already exists with this ID, registration number, email or username"
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(account.password, salt);

    const doctor = new Doctor({
      doctorId,
      name,
      registrationNumber,
      specialization,
      hospital,
      contact,
      consultation,
      account: {
        username: account.username,
        passwordHash: passwordHash,
        role: account.role || "DOCTOR",
        active: true
      }
    });

    await doctor.save();

    const token = generateToken(doctor.doctorId, doctor.contact.email, doctor.account.role);

    res.status(201).json({
      success: true,
      data: {
        doctorId: doctor.doctorId,
        name: doctor.name,
        email: doctor.contact.email,
        username: doctor.account.username,
        role: doctor.account.role,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const loginDoctor = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide username and password"
      });
    }

    const doctor = await Doctor.findOne({
      $or: [
        { "account.username": username },
        { "contact.email": username }
      ]
    });

    if (!doctor) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    if (!doctor.account.active) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated"
      });
    }

    if (doctor.isLocked()) {
      return res.status(401).json({
        success: false,
        message: "Account is locked. Please try after 30 minutes"
      });
    }

    const isPasswordValid = await doctor.comparePassword(password);

    if (!isPasswordValid) {
      await doctor.incrementLoginAttempts();
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    await doctor.resetLoginAttempts();

    doctor.account.lastLogin = new Date();
    await doctor.save();

    const token = generateToken(doctor.doctorId, doctor.contact.email, doctor.account.role);

    res.json({
      success: true,
      data: {
        doctorId: doctor.doctorId,
        name: doctor.name,
        email: doctor.contact.email,
        username: doctor.account.username,
        role: doctor.account.role,
        specialization: doctor.specialization,
        hospital: doctor.hospital,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ doctorId: req.doctor.doctorId });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    res.json({
      success: true,
      data: {
        doctorId: doctor.doctorId,
        name: doctor.name,
        registrationNumber: doctor.registrationNumber,
        specialization: doctor.specialization,
        hospital: doctor.hospital,
        contact: doctor.contact,
        consultation: doctor.consultation,
        account: {
          username: doctor.account.username,
          role: doctor.account.role,
          active: doctor.account.active,
          lastLogin: doctor.account.lastLogin
        },
        createdAt: doctor.createdAt,
        updatedAt: doctor.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ doctorId: req.doctor.doctorId });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    const allowedUpdates = [
      "name",
      "contact",
      "specialization",
      "consultation"
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field]) {
        doctor[field] = req.body[field];
      }
    });

    await doctor.save();

    res.json({
      success: true,
      data: doctor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current and new password"
      });
    }

    const doctor = await Doctor.findOne({ doctorId: req.doctor.doctorId });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    const isPasswordValid = await doctor.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    const salt = await bcrypt.genSalt(10);
    doctor.account.passwordHash = await bcrypt.hash(newPassword, salt);
    await doctor.save();

    res.json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const logoutDoctor = async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ "account.active": true }).select(
      "-account.passwordHash"
    );
    res.json({
      success: true,
      count: doctors.length,
      data: doctors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ doctorId: req.params.doctorId }).select(
      "-account.passwordHash"
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    res.json({
      success: true,
      data: doctor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};