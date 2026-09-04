const { v2: cloudinary } = require("cloudinary");

let configured = false;

function ensureConfig() {
  if (configured) return;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    const err = new Error("Cloudinary is not configured");
    err.statusCode = 500;
    throw err;
  }
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
  configured = true;
}

async function uploadExpenseReceipt(fileData, originalName = "") {
  ensureConfig();
  const uploaded = await cloudinary.uploader.upload(fileData, {
    folder: "stitchflow/expenses",
    resource_type: "auto",
    use_filename: true,
    unique_filename: true,
    overwrite: false,
  });
  return {
    url: uploaded.secure_url || "",
    publicId: uploaded.public_id || "",
    originalName: originalName || "",
  };
}

async function deleteCloudinaryAsset(publicId) {
  if (!publicId) return;
  ensureConfig();
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    return;
  } catch (_err) {
    // Continue and try as raw.
  }
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
    return;
  } catch (_err) {
    // Continue and try as video.
  }
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
  } catch (_err) {
    // Ignore cleanup failures to avoid blocking user operations.
  }
}

module.exports = {
  uploadExpenseReceipt,
  deleteCloudinaryAsset,
};
