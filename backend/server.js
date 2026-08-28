import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./src/DB/index.js";
import doctorRoutes from "./src/Routes/doctorRoutes.js"
import patientRoutes from "./src/Routes/patientRoutes.js"
import abhalink from "./src/Routes/abhalink.js"
import faceSearch from "./src/Routes/FaceSearch.js"
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/doctor" , doctorRoutes)
app.use("/patient" , patientRoutes)
app.use("/patient/abha/faceLink" , abhalink)
app.use("/patient/abha/facesearch" , faceSearch)
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
