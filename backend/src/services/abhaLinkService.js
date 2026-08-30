import cloudinary from '../utils/cloudinary.js';
import Patient from '../Models/abha.model.js';
import { generateFaceId } from './abhaService.js';
import { extractFaceEmbedding } from './faceService.js';

export const linkFaceToABHA = async (abhaId, faceImage) => {
  try {
    if (!abhaId) {
      return { success: false, message: 'ABHA ID is required' };
    }

    if (!faceImage) {
      return { success: false, message: 'Face image is required' };
    }

    const patient = await Patient.findOne({ abhaId });
    
    if (!patient) {
      return { 
        success: false, 
        message: 'Patient not found with this ABHA ID' 
      };
    }

    if (patient.faceData && patient.faceData.faceEmbedding && patient.faceData.faceEmbedding.length > 0) {
      return {
        success: false,
        message: 'Face already linked to this ABHA ID',
        data: {
          abhaId: patient.abhaId,
          name: patient.name,
          faceLinked: true,
          faceId: patient.faceData.faceImages?.[0]?.imageId || null
        }
      };
    }

    const embeddingResult = await extractFaceEmbedding(faceImage);
    
    if (!embeddingResult.success) {
      return { 
        success: false, 
        message: 'Face detection failed: ' + embeddingResult.message 
      };
    }

    if (embeddingResult.faces_detected === 0) {
      return { 
        success: false, 
        message: 'No face detected. Please provide a clear face photo.' 
      };
    }

    if (embeddingResult.faces_detected > 1) {
      return { 
        success: false, 
        message: `Multiple faces detected (${embeddingResult.faces_detected}). Please provide a single face photo.` 
      };
    }

    const faceEmbedding = embeddingResult.embedding;
    const quality = embeddingResult.quality || 0.5;

    let imageData = faceImage;
    if (faceImage.includes('base64,')) {
      imageData = faceImage.split('base64,')[1];
    }

    const faceId = generateFaceId();

    let cloudinaryResult;
    try {
      cloudinaryResult = await cloudinary.uploader.upload(
        `data:image/jpeg;base64,${imageData}`,
        {
          folder: 'patient_faces',
          public_id: `face_${abhaId}`,
          overwrite: true,
          format: 'jpg',
          quality: 'auto:good',
          transformation: [{ width: 640, height: 640, crop: 'limit' }]
        }
      );
    } catch (error) {
      return { success: false, message: 'Failed to upload face image: ' + error.message };
    }

    if (!patient.faceData) {
      patient.faceData = {};
    }

    patient.faceData.faceEmbedding = faceEmbedding;
    
    if (!patient.faceData.faceImages) {
      patient.faceData.faceImages = [];
    }
    
    patient.faceData.faceImages.push({
      imageId: faceId,
      imageUrl: cloudinaryResult.secure_url,
      embedding: faceEmbedding,
      capturedAt: new Date(),
      angle: 'FRONT',
      quality: quality,
      isPrimary: true
    });

    if (!patient.faceData.recognition) {
      patient.faceData.recognition = {
        enabled: true,
        modelUsed: 'FaceNet512',
        version: '1.0.0',
        threshold: 0.75,
        registeredAt: new Date(),
        verificationCount: 0,
        successRate: 0
      };
    } else {
      patient.faceData.recognition.registeredAt = new Date();
      patient.faceData.recognition.enabled = true;
    }

    if (!patient.faceData.livenessCheck) {
      patient.faceData.livenessCheck = {
        enabled: true,
        status: 'PENDING',
        confidence: 0
      };
    }

    patient.updatedAt = new Date();
    await patient.save();

    return {
      success: true,
      message: 'Face linked to ABHA ID successfully',
      data: {
        abhaId: patient.abhaId,
        faceId: faceId,
        name: patient.name,
        faceUrl: cloudinaryResult.secure_url,
        embeddingSize: faceEmbedding.length,
        quality: quality,
        linkedAt: new Date()
      }
    };

  } catch (error) {
    return { success: false, message: 'Failed to link face: ' + error.message };
  }
};

export const getPatientByABHA = async (abhaId) => {
  try {
    const patient = await Patient.findOne({ abhaId });
    
    if (!patient) {
      return { 
        success: false, 
        message: 'Patient not found' 
      };
    }

    const hasFace = patient.faceData && patient.faceData.faceEmbedding && patient.faceData.faceEmbedding.length > 0;

    return {
      success: true,
      data: {
        abhaId: patient.abhaId,
        name: patient.name,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        mobile: patient.mobile,
        email: patient.email || '',
        address: patient.address,
        hasFace: hasFace,
        faceLinkedAt: hasFace ? patient.faceData.faceImages?.[0]?.capturedAt || null : null,
        verificationCount: hasFace ? patient.faceData.recognition?.verificationCount || 0 : 0,
        isActive: patient.activeStatus
      }
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const checkFaceLink = async (abhaId) => {
  try {
    const patient = await Patient.findOne({ abhaId });
    
    if (!patient) {
      return { 
        success: false, 
        message: 'Patient not found' 
      };
    }

    const hasFace = patient.faceData && patient.faceData.faceEmbedding && patient.faceData.faceEmbedding.length > 0;

    return {
      success: true,
      data: {
        abhaId: patient.abhaId,
        name: patient.name,
        faceLinked: hasFace,
        faceId: hasFace ? patient.faceData.faceImages?.[0]?.imageId : null,
        faceUrl: hasFace ? patient.faceData.faceImages?.[0]?.imageUrl : null
      }
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};