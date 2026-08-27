// middleware/auth.js
import jwt from "jsonwebtoken";
import Doctor from "../Models/Doctor.model.js";
export const generateToken = (doctorId, email, role) => {
  return jwt.sign(
    {
      doctorId,
      email,
      role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || "7d"
    }
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token"
      });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, invalid token"
      });
    }

    const doctor = await Doctor.findOne({ doctorId: decoded.doctorId });

    if (!doctor) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, doctor not found"
      });
    }

    if (!doctor.account.active) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated"
      });
    }

    req.doctor = doctor;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized",
      error: error.message
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.doctor.account.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.doctor.account.role} is not authorized to access this route`
      });
    }
    next();
  };
};