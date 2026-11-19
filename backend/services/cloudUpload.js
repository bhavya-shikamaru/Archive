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
  // Cloudinary not installed, local storage fallback will be used
}
const fs = require('fs');

/**
 * Uploads a local file to Cloudinary for persistent storage
 * @param {string} filePath - Absolute path to local file
 * @param {string} originalName - Original filename
 * @returns {Promise<string|null>} - Returns secure URL if uploaded, null if Cloudinary not configured
 */
const uploadToCloudinary = async (filePath, originalName) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    return null; // Fallback to local storage
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'raw', // Preserves PDF format
      folder: 'cpms_resumes',
      use_filename: true,
      unique_filename: true
    });

    // Delete local temporary file after successful cloud upload
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
    return null; // Fall back to local URL if cloud upload fails
  }
};

module.exports = { uploadToCloudinary };
