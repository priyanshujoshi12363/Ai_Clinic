import {
  linkFaceToABHA,
  getPatientByABHA,
  checkFaceLink
} from '../services/abhaLinkService.js';

export const verifyABHA = async (req, res) => {
  try {
    const { abhaId } = req.body;
    
    if (!abhaId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ABHA ID is required' 
      });
    }

    const result = await getPatientByABHA(abhaId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json({
      success: true,
      message: 'ABHA ID verified successfully',
      data: result.data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkFaceLinked = async (req, res) => {
  try {
    const { abhaId } = req.params;
    
    if (!abhaId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ABHA ID is required' 
      });
    }

    const result = await checkFaceLink(abhaId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const linkFace = async (req, res) => {
  try {
    const { abhaId, faceImage } = req.body;
    
    if (!abhaId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ABHA ID is required' 
      });
    }

    if (!faceImage) {
      return res.status(400).json({ 
        success: false, 
        message: 'Face image is required' 
      });
    }

    const result = await linkFaceToABHA(abhaId, faceImage);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getABHAPatientDetails = async (req, res) => {
  try {
    const { abhaId } = req.params;
    
    if (!abhaId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ABHA ID is required' 
      });
    }

    const result = await getPatientByABHA(abhaId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};