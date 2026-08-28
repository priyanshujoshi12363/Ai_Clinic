import Patient from '../Models/abha.model.js';
import { extractFaceEmbedding } from './faceService.js';

export const findPatientByFace = async (faceImage, threshold = 0.75) => {
  try {
    if (!faceImage) {
      return { 
        success: false, 
        message: 'Face image is required' 
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

    const newEmbedding = embeddingResult.embedding;

    const allPatients = await Patient.find({ 
      'faceData.faceEmbedding': { $exists: true, $ne: null } 
    });

    if (allPatients.length === 0) {
      return {
        success: false,
        message: 'No registered patients found in the system',
        found: false
      };
    }

    let bestMatch = null;
    let bestScore = 0;

    for (const patient of allPatients) {
      if (!patient.faceData || !patient.faceData.faceEmbedding) {
        continue;
      }

      const storedEmbedding = patient.faceData.faceEmbedding;
      
      const similarity = calculateCosineSimilarity(newEmbedding, storedEmbedding);
      
      if (similarity > bestScore) {
        bestScore = similarity;
        bestMatch = patient;
      }
    }

    if (bestMatch && bestScore >= threshold) {
      if (bestMatch.faceData && bestMatch.faceData.recognition) {
        bestMatch.faceData.recognition.verificationCount += 1;
        bestMatch.faceData.recognition.lastVerified = new Date();
        bestMatch.faceData.recognition.successRate = 
          (bestMatch.faceData.recognition.verificationCount / 
           (bestMatch.faceData.recognition.verificationCount + 1)) * 100;
        await bestMatch.save();
      }

      return {
        success: true,
        found: true,
        confidence: bestScore,
        threshold: threshold,
        data: {
          abhaId: bestMatch.abhaId,
          name: bestMatch.name,
          dateOfBirth: bestMatch.dateOfBirth,
          gender: bestMatch.gender,
          mobile: bestMatch.mobile,
          email: bestMatch.email || '',
          address: bestMatch.address,
          faceData: {
            faceId: bestMatch.faceData?.faceImages?.[0]?.imageId || null,
            faceUrl: bestMatch.faceData?.faceImages?.[0]?.imageUrl || null,
            verificationCount: bestMatch.faceData?.recognition?.verificationCount || 0,
            lastVerified: bestMatch.faceData?.recognition?.lastVerified || null
          },
          medicalHistory: bestMatch.medicalHistory || {},
          totalVisits: bestMatch.totalVisits || 0,
          lastVisitDate: bestMatch.lastVisitDate || null,
          activeStatus: bestMatch.activeStatus
        }
      };
    }

    return {
      success: true,
      found: false,
      message: 'No matching face found. Please register or try again.',
      confidence: bestScore,
      threshold: threshold
    };

  } catch (error) {
    return { 
      success: false, 
      message: 'Failed to search face: ' + error.message,
      found: false
    };
  }
};

const calculateCosineSimilarity = (embedding1, embedding2) => {
  if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
    return 0;
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }

  if (norm1 === 0 || norm2 === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
};

export const getPatientFaceStatus = async (abhaId) => {
  try {
    const patient = await Patient.findOne({ abhaId });
    
    if (!patient) {
      return {
        success: false,
        message: 'Patient not found'
      };
    }

    const hasFace = patient.faceData && 
                    patient.faceData.faceEmbedding && 
                    patient.faceData.faceEmbedding.length > 0;

    return {
      success: true,
      data: {
        abhaId: patient.abhaId,
        name: patient.name,
        hasFace: hasFace,
        faceId: hasFace ? patient.faceData.faceImages?.[0]?.imageId : null,
        faceUrl: hasFace ? patient.faceData.faceImages?.[0]?.imageUrl : null,
        verificationCount: hasFace ? patient.faceData.recognition?.verificationCount || 0 : 0,
        lastVerified: hasFace ? patient.faceData.recognition?.lastVerified || null : null
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};