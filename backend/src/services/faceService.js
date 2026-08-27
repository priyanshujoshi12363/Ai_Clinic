import axios from 'axios';

const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || 'http://localhost:8001';

export const extractFaceEmbedding = async (imageBase64, abhaId = null) => {
  try {
    const response = await axios.post(`${FACE_SERVICE_URL}/api/extract`, {
      image: imageBase64,
      abhaId: abhaId
    });
    
    return response.data;
  } catch (error) {
    console.error('Face service error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
      embedding: null,
      faces_detected: 0,
      embedding_size: 0
    };
  }
};

export const compareFaces = async (image1, image2) => {
  try {
    const response = await axios.post(`${FACE_SERVICE_URL}/api/compare`, {
      image1: image1,
      image2: image2
    });
    
    return response.data;
  } catch (error) {
    console.error('Face compare error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
      verified: false,
      confidence: 0,
      distance: 1
    };
  }
};

export const verifyFaceWithEmbedding = async (image, embedding) => {
  try {
    const response = await axios.post(`${FACE_SERVICE_URL}/api/verify`, {
      image: image,
      embedding: embedding
    });
    
    return response.data;
  } catch (error) {
    console.error('Face verify error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
      verified: false,
      confidence: 0,
      distance: 1
    };
  }
};

export const healthCheck = async () => {
  try {
    const response = await axios.get(`${FACE_SERVICE_URL}/api/health`);
    return response.data;
  } catch (error) {
    return {
      success: false,
      status: 'unhealthy',
      error: error.message
    };
  }
};