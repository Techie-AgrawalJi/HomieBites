import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || '').trim();
const apiKey = (process.env.CLOUDINARY_API_KEY || '').trim();
const apiSecret = (process.env.CLOUDINARY_API_SECRET || '').trim();
const hasCloudinaryConfig = !!(cloudName && apiKey && apiSecret);

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

const storage = hasCloudinaryConfig
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'homiebites',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      } as any,
    })
  : multer.memoryStorage();

if (!hasCloudinaryConfig) {
  console.warn('Cloudinary credentials are missing. File uploads are accepted but not persisted.');
}

export const upload = multer({ storage });
export default cloudinary;

