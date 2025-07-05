import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import { Request, Response } from 'express';
import logger from '../config/logger';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'x-clone',
    resource_type: 'auto', // Supports images and videos
  } as any,
});

export const uploadMedia = multer({ storage }).single('media');

export const uploadMediaHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.auth.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'No media file provided' });
      return;
    }
    logger.info(`Media uploaded by user ${req.auth.userId}: ${req.file.path}`);
    res.json({ url: req.file.path });
  } catch (error) {
    logger.error('Media upload error:', error);
    res.status(500).json({ error: 'Failed to upload media' });
  }
};