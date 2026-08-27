import mongoose from "mongoose";

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
      mobile: String,
      email: String
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
        unique: true
      },
      passwordHash: String,
      role: {
        type: String,
        default: "DOCTOR"
      },
      active: {
        type: Boolean,
        default: true
      }
    }
  },
  {
    timestamps: true
  }
);

doctorSchema.index({
  "hospital.hospitalId": 1
});

doctorSchema.index({
  "hospital.departmentId": 1
});

doctorSchema.index({
  specialization: 1
});

const Doctor = mongoose.model("Doctor", doctorSchema);

export default Doctor;