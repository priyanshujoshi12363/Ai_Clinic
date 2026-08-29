import { aadhaarData } from '../utils/Aadharmockdata.js';
import cloudinary from '../utils/cloudinary.js';
import Patient from '../Models/abha.model.js';
import { generateABHAId, generateFaceId } from './abhaService.js';
import { extractFaceEmbedding } from './faceService.js';

export const findAadhaarByNumber = (aadhaarNumber) => {
  const cleanNumber = aadhaarNumber.replace(/[\s-]/g, '');
  const found = aadhaarData.aadhaarCards.find(card => card.aadhaarNumber === cleanNumber);
  if (!found) {
    return { success: false, message: 'Aadhaar number not found' };
  }
  return { success: true, data: found };
};

export const generateOTP = (aadhaarNumber) => {
  const cleanNumber = aadhaarNumber.replace(/[\s-]/g, '');
  const aadhaarResult = findAadhaarByNumber(cleanNumber);
  if (!aadhaarResult.success) {
    return { success: false, message: aadhaarResult.message };
  }
  const otp = String(Math.floor(1000 + Math.random() * 9000));
  global.otpStore = global.otpStore || {};
  global.otpStore[cleanNumber] = {
    otp: otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
    mobile: aadhaarResult.data.mobile
  };
  return {
    success: true,
    message: 'OTP generated successfully',
    data: { otp: otp, mobile: aadhaarResult.data.mobile, expiresIn: 300 }
  };
};

export const verifyOTPCode = (aadhaarNumber, otp) => {
  const cleanNumber = aadhaarNumber.replace(/[\s-]/g, '');
  const stored = global.otpStore && global.otpStore[cleanNumber];
  if (!stored) {
    return { success: false, message: 'No OTP found. Please request a new OTP.' };
  }
  if (Date.now() > stored.expiresAt) {
    delete global.otpStore[cleanNumber];
    return { success: false, message: 'OTP has expired. Please request a new OTP.' };
  }
  if (stored.otp !== otp) {
    return { success: false, message: 'Invalid OTP. Please try again.' };
  }
  delete global.otpStore[cleanNumber];
  return { success: true, message: 'OTP verified successfully' };
};

export const registerPatientWithAadhaarAndFace = async (aadhaarNumber, otp, faceImage) => {
  try {
    const cleanNumber = aadhaarNumber.replace(/[\s-]/g, '');

    if (!/^\d{12}$/.test(cleanNumber)) {
      return { success: false, message: 'Invalid Aadhaar number' };
    }

    const aadhaarResult = findAadhaarByNumber(cleanNumber);
    if (!aadhaarResult.success) {
      return aadhaarResult;
    }
    const aadhaarInfo = aadhaarResult.data;

    if (!otp || otp.length !== 4) {
      return { success: false, message: 'Invalid OTP' };
    }

    const existingPatient = await Patient.findOne({ aadhaarNumber: cleanNumber });
    if (existingPatient && existingPatient.faceData && existingPatient.faceData.faceEmbedding) {
      return {
        success: false,
        message: 'Patient already registered with face',
        data: {
          abhaId: existingPatient.abhaId,
          name: existingPatient.name,
          alreadyRegistered: true
        }
      };
    }

    if (!faceImage) {
      return { success: false, message: 'Face image is required' };
    }

    console.log('Extracting face embedding...');
    const embeddingResult = await extractFaceEmbedding(faceImage, null);
    
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
        message: `Multiple faces detected (${embeddingResult.faces_detected})` 
      };
    }

    const faceEmbedding = embeddingResult.embedding;
    const quality = embeddingResult.quality || 0.5;
    console.log('Face embedding extracted successfully');
    console.log(' Uploading to Cloudinary...');
    
    let imageData = faceImage;
    if (faceImage.includes('base64,')) {
      imageData = faceImage;
    }

    const abhaId = generateABHAId();
    const faceId = generateFaceId();

    let cloudinaryResult;
    try {
      cloudinaryResult = await cloudinary.uploader.upload(
        imageData,
        {
          folder: 'patient_faces',
          public_id: `face_${abhaId}`,
          overwrite: true,
          format: 'jpg',
          quality: 'auto:good',
          transformation: [{ width: 640, height: 640, crop: 'limit' }]
        }
      );
      console.log('Cloudinary upload successful');
    } catch (error) {
      return { success: false, message: 'Failed to upload face image: ' + error.message };
    }
    console.log('Creating patient in MongoDB...');
    
    const nameParts = aadhaarInfo.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    let patient;
    try {
      if (existingPatient) {
        existingPatient.faceData = {
          faceEmbedding: faceEmbedding,
          faceImages: [{
            imageId: faceId,
            imageUrl: cloudinaryResult.secure_url,
            embedding: faceEmbedding,
            capturedAt: new Date(),
            angle: 'FRONT',
            quality: quality,
            isPrimary: true
          }],
          recognition: {
            enabled: true,
            modelUsed: 'FaceNet512',
            version: '1.0.0',
            threshold: 0.75,
            registeredAt: new Date(),
            verificationCount: 0,
            successRate: 0
          },
          livenessCheck: {
            enabled: true,
            status: 'PENDING',
            confidence: 0
          }
        };
        existingPatient.updatedAt = new Date();
        patient = await existingPatient.save();
        console.log('Existing patient updated with face');
      } else {
        patient = new Patient({
          abhaId: abhaId,
          aadhaarNumber: cleanNumber,
          name: `${firstName} ${lastName}`,
          dateOfBirth: aadhaarInfo.dateOfBirth,
          gender: aadhaarInfo.gender === 'M' ? 'Male' : 'Female',
          mobile: aadhaarInfo.mobile || '',
          email: '',
          preferredLanguage: 'Hindi',
          languages: ['Hindi', 'English'],
        
          faceData: {
            faceEmbedding: faceEmbedding,
            faceImages: [{
              imageId: faceId,
              imageUrl: cloudinaryResult.secure_url,
              embedding: faceEmbedding,
              capturedAt: new Date(),
              angle: 'FRONT',
              quality: quality,
              isPrimary: true
            }],
            recognition: {
              enabled: true,
              modelUsed: 'FaceNet512',
              version: '1.0.0',
              threshold: 0.75,
              registeredAt: new Date(),
              verificationCount: 0,
              successRate: 0
            },
            livenessCheck: {
              enabled: true,
              status: 'PENDING',
              confidence: 0
            }
          },
          
          address: {
            house: aadhaarInfo.address.house || '',
            street: aadhaarInfo.address.street || '',
            locality: aadhaarInfo.address.locality || '',
            village: '',
            district: aadhaarInfo.address.district || '',
            state: aadhaarInfo.address.state || '',
            country: aadhaarInfo.address.country || 'India',
            pincode: aadhaarInfo.address.pincode || ''
          },
          
          medicalHistory: {
            conditions: [],
            allergies: [],
            surgeries: [],
            familyHistory: [],
            lifestyle: {
              smoking: false,
              alcohol: false,
              exercise: 'Moderate',
              diet: ''
            }
          },
          
          visits: [],
          labReports: [],
          prescriptions: [],
          documents: [],
          consents: [],
          sessions: [],
          medicalTimeline: [],
          
          activeStatus: true,
          totalVisits: 0,
          totalPrescriptions: 0,
          totalDocuments: 0,
        
          abdmDetails: {
            syncStatus: 'NOT_SYNCED'
          }
        });
        
        patient = await patient.save();
        console.log('New patient created successfully');
      }

    } catch (error) {
      console.error('Database error:', error);
      return { success: false, message: 'Database error: ' + error.message };
    }

    return {
      success: true,
      message: existingPatient ? 'Face linked to existing patient' : 'Patient registered successfully',
      data: {
        abhaId: patient.abhaId,
        faceId: faceId,
        name: patient.name,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        mobile: patient.mobile,
        address: patient.address,
        faceUrl: cloudinaryResult.secure_url,
        faceEmbedding: faceEmbedding,
        embeddingSize: faceEmbedding.length,
        quality: quality,
        registeredAt: new Date(),
        isExisting: !!existingPatient
      }
    };

  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, message: 'Registration failed: ' + error.message };
  }
};