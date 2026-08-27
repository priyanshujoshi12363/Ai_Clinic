import cloudinary from '../utils/cloudinary.js';

export const uploadFaceImage = async (imageBase64, abhaId) => {
  try {
    let imageData = imageBase64;
    if (imageBase64.includes('base64,')) {
      imageData = imageBase64.split('base64,')[1];
    }

    const result = await cloudinary.uploader.upload(`data:image/jpeg;base64,${imageData}`, {
      folder: 'patient_faces',
      public_id: `face_${abhaId}`,
      overwrite: true,
      format: 'jpg',
      quality: 'auto:good',
      transformation: [
        { width: 640, height: 640, crop: 'limit' }
      ]
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      metadata: {
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes,
        createdAt: result.created_at
      }
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

export const deleteFaceImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return {
      success: true,
      result
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

export const getFaceImageUrl = (publicId, options = {}) => {
  try {
    const transformations = [];
    
    if (options.width) {
      transformations.push(`w_${options.width}`);
    }
    if (options.height) {
      transformations.push(`h_${options.height}`);
    }
    if (options.crop) {
      transformations.push(`c_${options.crop}`);
    }
    if (options.quality) {
      transformations.push(`q_${options.quality}`);
    }
    if (options.format) {
      transformations.push(`f_${options.format}`);
    }

    const transformationString = transformations.length > 0 
      ? transformations.join(',') + '/' 
      : '';

    return cloudinary.url(publicId, {
      transformation: transformationString,
      secure: true
    });
  } catch (error) {
    return null;
  }
};

export const uploadBase64Image = async (imageBase64, folder, publicId) => {
  try {
    let imageData = imageBase64;
    if (imageBase64.includes('base64,')) {
      imageData = imageBase64.split('base64,')[1];
    }

    const result = await cloudinary.uploader.upload(`data:image/jpeg;base64,${imageData}`, {
      folder: folder || 'uploads',
      public_id: publicId || undefined,
      overwrite: true,
      quality: 'auto'
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      metadata: {
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

export const uploadFile = async (fileBuffer, folder, publicId, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder || 'uploads',
        public_id: publicId || undefined,
        format: options.format || 'jpg',
        quality: options.quality || 'auto',
        transformation: options.transformation || []
      },
      (error, result) => {
        if (error) {
          reject({
            success: false,
            message: error.message
          });
        } else {
          resolve({
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            metadata: {
              width: result.width,
              height: result.height,
              format: result.format,
              size: result.bytes
            }
          });
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};