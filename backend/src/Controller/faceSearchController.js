import { findPatientByFace, getPatientFaceStatus } from '../services/faceSearchService.js';

export const searchPatientByFace = async (req, res) => {
  try {
    const { faceImage, threshold } = req.body;
    
    if (!faceImage) {
      return res.status(400).json({ 
        success: false, 
        message: 'Face image is required' 
      });
    }

    const result = await findPatientByFace(faceImage, threshold || undefined);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const getPatientFaceStatusController = async (req, res) => {
  try {
    const { abhaId } = req.params;
    
    if (!abhaId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ABHA ID is required' 
      });
    }

    const result = await getPatientFaceStatus(abhaId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};