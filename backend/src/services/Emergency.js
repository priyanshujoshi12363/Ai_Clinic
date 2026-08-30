import Emergency from '../Models/Emergency.js';

export const createEmergency = async (symptoms, patientName = 'Unknown') => {
  const tokenNumber = `EMG-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
  
  const queueCount = await Emergency.countDocuments({ status: 'WAITING' });

  const emergency = new Emergency({
    tokenNumber,
    patientName,
    symptoms,
    aiSummary: `Patient presents with: ${symptoms}`,
    status: 'WAITING',
    queuePosition: queueCount + 1
  });

  await emergency.save();

  return emergency;
};

export const getEmergencyQueue = async () => {
  return await Emergency.find({ status: 'WAITING' }).sort({ createdAt: 1 });
};

export const updateEmergencyStatus = async (tokenNumber, status) => {
  return await Emergency.findOneAndUpdate(
    { tokenNumber },
    { status },
    { new: true }
  );
};