import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./src/DB/index.js";
import doctorRoutes from "./src/Routes/doctorRoutes.js"
import patientRoutes from "./src/Routes/patientRoutes.js"
import faceSearch from "./src/Routes/FaceSearch.js"
import abhaLink from "./src/Routes/abhaLinkRoutes.js"
import emergency from "./src/Routes/emergencyRoutes.js"
import consult from "./src/Routes/ConsulatationRoutes.js"
import intake from "./src/Routes/intakeRoutes.js"
import voice from "./src/Routes/voiceRoutes.js"
import clinical from "./src/Routes/clinicalRoutes.js"
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/doctor" , doctorRoutes)
app.use("/patient" , patientRoutes)
app.use("/patient/abha/facesearch" , faceSearch)
app.use("/patient/abha" , abhaLink)
app.use("/emergency" , emergency)
app.use("/consult" , consult)
app.use("/intake" , intake)
app.use("/voice" , voice)
app.use("/clinical" , clinical)
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Aayush Hackathon API Server",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString()
  });
});

const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
