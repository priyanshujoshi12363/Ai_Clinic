import Emergency from '../Models/Emergency.js';
import { triageRank } from './emergencyEngine.js';

export const createEmergency = async (symptoms, patientName = 'Unknown') => {
  const tokenNumber = `EM-${String(Date.now()).slice(-4)}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
  const queueCount = await Emergency.countDocuments({ status: 'WAITING' });

  const emergency = new Emergency({
    tokenNumber,
    patientName,
    symptoms,
    chiefComplaint: String(symptoms).slice(0, 120),
    aiSummary: `Patient presents with: ${symptoms}`,
    triageLevel: 'YELLOW',
    triageLabel: 'Urgent',
    targetMinutes: 60,
    urgency: 'URGENT',
    status: 'WAITING',
    queuePosition: queueCount + 1
  });

  await emergency.save();
  return emergency;
};

export const getEmergencyQueue = async () => {
  const records = await Emergency.find({ status: { $in: ['WAITING', 'IN_PROGRESS'] } });

  return records.sort((a, b) => {
    const rank = triageRank(a.triageLevel) - triageRank(b.triageLevel);
    return rank !== 0 ? rank : new Date(a.createdAt) - new Date(b.createdAt);
  });
};

export const updateEmergencyStatus = async (tokenNumber, status, attendedBy) => {
  const update = { status };

  if (status === 'IN_PROGRESS') {
    update.attendedAt = new Date();
    if (attendedBy) update.attendedBy = attendedBy;
  }
  if (status === 'COMPLETED') update.completedAt = new Date();

  return Emergency.findOneAndUpdate({ tokenNumber }, update, { new: true });
};
