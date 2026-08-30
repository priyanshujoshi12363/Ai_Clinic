import { createEmergency, getEmergencyQueue, updateEmergencyStatus } from '../services/Emergency.js';

export const handleEmergency = async (req, res) => {
  try {
    const { symptoms, patientName } = req.body;

    if (!symptoms) {
      return res.status(400).json({
        success: false,
        message: 'Symptoms are required'
      });
    }

    const emergency = await createEmergency(symptoms, patientName || 'Unknown');

    res.status(201).json({
      success: true,
      message: 'Emergency case created',
      data: {
        tokenNumber: emergency.tokenNumber,
        patientName: emergency.patientName,
        symptoms: emergency.symptoms,
        queuePosition: emergency.queuePosition,
        status: emergency.status
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getEmergency = async (req, res) => {
  try {
    const emergencies = await getEmergencyQueue();
    res.json({
      success: true,
      count: emergencies.length,
      data: emergencies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateEmergency = async (req, res) => {
  try {
    const { tokenNumber } = req.params;
    const { status } = req.body;

    const emergency = await updateEmergencyStatus(tokenNumber, status);

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: 'Emergency not found'
      });
    }

    res.json({
      success: true,
      message: 'Emergency updated',
      data: emergency
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};