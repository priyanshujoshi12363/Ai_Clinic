import mongoose from 'mongoose';

const emergencySchema = new mongoose.Schema({
  tokenNumber: { type: String, required: true, unique: true },
  patientName: { type: String, default: 'Unknown' },
  symptoms: { type: String, required: true },
  aiSummary: { type: String },
  status: { 
    type: String, 
    enum: ['WAITING', 'IN_PROGRESS', 'COMPLETED'], 
    default: 'WAITING' 
  },
  queuePosition: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

const Emergency = mongoose.model('Emergency', emergencySchema);
export default Emergency;