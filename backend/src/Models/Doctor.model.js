import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const doctorSchema = new mongoose.Schema(
  {
    doctorId: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      firstName: {
        type: String,
        required: true
      },
      middleName: String,
      lastName: {
        type: String,
        required: true
      }
    },
    registrationNumber: {
      type: String,
      required: true,
      unique: true
    },
    specialization: {
      type: String,
      required: true
    },
    hospital: {
      hospitalId: {
        type: String,
        required: true
      },
      hospitalName: {
        type: String,
        required: true
      },
      departmentId: {
        type: String,
        required: true
      },
      departmentName: {
        type: String,
        required: true
      }
    },
    contact: {
      mobile: {
        type: String,
        required: true
      },
      email: {
        type: String,
        required: true,
        unique: true
      }
    },
    consultation: {
      types: [
        {
          type: String,
          enum: ["GENERAL_OPD", "AYUSH"]
        }
      ]
    },
    account: {
      username: {
        type: String,
        required: true,
        unique: true
      },
      passwordHash: {
        type: String,
        required: true
      },
      role: {
        type: String,
        default: "DOCTOR"
      },
      active: {
        type: Boolean,
        default: true
      },
      lastLogin: Date,
      loginAttempts: {
        type: Number,
        default: 0
      },
      lockedUntil: Date
    }
  },
  {
    timestamps: true
  }
);

doctorSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.account.passwordHash);
};

doctorSchema.methods.incrementLoginAttempts = function() {
  this.account.loginAttempts += 1;
  if (this.account.loginAttempts >= 5) {
    this.account.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
  }
  return this.save();
};

doctorSchema.methods.resetLoginAttempts = function() {
  this.account.loginAttempts = 0;
  this.account.lockedUntil = null;
  return this.save();
};

doctorSchema.methods.isLocked = function() {
  if (this.account.lockedUntil && this.account.lockedUntil > new Date()) {
    return true;
  }
  return false;
};

doctorSchema.index({
  "hospital.hospitalId": 1
});

doctorSchema.index({
  "hospital.departmentId": 1
});

doctorSchema.index({
  specialization: 1
});

doctorSchema.index({
  "contact.email": 1
});

doctorSchema.index({
  "account.username": 1
});

const Doctor = mongoose.model("Doctor", doctorSchema);

export default Doctor;