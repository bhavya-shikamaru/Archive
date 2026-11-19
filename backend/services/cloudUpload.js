let cloudinary = null;
try {
  cloudinary = require('cloudinary').v2;
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
  }
} catch (e) {
  
}
const fs = require('fs');

const uploadToCloudinary = async (filePath, originalName) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    return null; 
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'auto',
      folder: 'cpms_resumes',
      use_filename: true,
      unique_filename: true,
      access_mode: 'public',
      type: 'upload'
    });

    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupErr) {
        console.warn('⚠️ Could not delete local temp upload:', cleanupErr.message);
      }
    }

    return result.secure_url;
  } catch (error) {
    console.error('❌ Cloudinary Upload Error:', error.message);
    return null; 
  }
};

module.exports = { uploadToCloudinary };
