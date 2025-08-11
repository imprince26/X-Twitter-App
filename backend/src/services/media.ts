import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer, { FileFilterCallback } from 'multer';
import { Request, Response } from 'express';

// Extend Request interface to include user from auth middleware
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    username: string;
    email: string;
    isAdmin: boolean;
    isModerator: boolean;
  };
  file?: Express.Multer.File & {
    path: string;
    filename: string;
    size: number;
  };
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary storage configuration
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'x-clone',
    resource_type: 'auto', // Supports images and videos
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi'],
    transformation: [
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ],
  } as any,
});

// File filter for media uploads
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  // Allowed file types
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and videos are allowed.'));
  }
};

// Multer configuration with file size limits
export const uploadMedia = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Single file upload middleware
export const uploadSingleMedia = uploadMedia.single('media');

// Multiple files upload middleware (up to 4 files for X posts)
export const uploadMultipleMedia = uploadMedia.array('media', 4);

// Profile picture upload
export const uploadProfilePicture = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'x-clone/profile-pictures',
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ],
    } as any,
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for profile pictures.'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for profile pictures
  },
}).single('profilePicture');

// Cover image upload
export const uploadCoverImage = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'x-clone/cover-images',
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        { width: 1500, height: 500, crop: 'fill' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ],
    } as any,
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for cover images.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for cover images
  },
}).single('coverImage');

// Media upload handler for posts
export const uploadMediaHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        error: 'Unauthorized - Authentication required' 
      });
      return;
    }

    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({ 
        success: false,
        error: 'No media file provided' 
      });
      return;
    }
    
    // Return upload details
    res.status(200).json({
      success: true,
      message: 'Media uploaded successfully',
      data: {
        url: req.file.path,
        filename: req.file.filename,
        size: req.file.size,
        format: req.file.mimetype,
        uploadedBy: req.user.userId,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Media upload error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to upload media',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Multiple media upload handler
export const uploadMultipleMediaHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        error: 'Unauthorized - Authentication required' 
      });
      return;
    }

    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      res.status(400).json({ 
        success: false,
        error: 'No media files provided' 
      });
      return;
    }

    // Process multiple files
    const uploadedFiles = files.map(file => ({
      url: file.path,
      filename: file.filename,
      size: file.size,
      format: file.mimetype
    }));

    console.info(`${files.length} media files uploaded by user ${req.user.userId}`);

    res.status(200).json({
      success: true,
      message: `${files.length} media files uploaded successfully`,
      data: {
        files: uploadedFiles,
        uploadedBy: req.user.userId,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Multiple media upload error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to upload media files',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Profile picture upload handler
export const uploadProfilePictureHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        error: 'Unauthorized - Authentication required' 
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({ 
        success: false,
        error: 'No profile picture provided' 
      });
      return;
    }

    console.info(`Profile picture uploaded by user ${req.user.userId}: ${req.file.path}`);

    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        profilePictureUrl: req.file.path,
        uploadedBy: req.user.userId,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to upload profile picture',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Cover image upload handler
export const uploadCoverImageHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        error: 'Unauthorized - Authentication required' 
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({ 
        success: false,
        error: 'No cover image provided' 
      });
      return;
    }

    console.info(`Cover image uploaded by user ${req.user.userId}: ${req.file.path}`);

    res.status(200).json({
      success: true,
      message: 'Cover image uploaded successfully',
      data: {
        coverImageUrl: req.file.path,
        uploadedBy: req.user.userId,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Cover image upload error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to upload cover image',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete media from Cloudinary
export const deleteMedia = async (publicId: string): Promise<boolean> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Media deletion error:', error);
    return false;
  }
};

// Get media info from Cloudinary
export const getMediaInfo = async (publicId: string): Promise<UploadApiResponse | null> => {
  try {
    const result = await cloudinary.api.resource(publicId);
    return result;
  } catch (error) {
    console.error('Get media info error:', error);
    return null;
  }
};

// Media validation helper
export const validateMediaFile = (file: Express.Multer.File): { isValid: boolean; error?: string } => {
  // Check file size (50MB max)
  if (file.size > 50 * 1024 * 1024) {
    return { isValid: false, error: 'File size too large. Maximum size is 50MB.' };
  }

  // Check file type
  const allowedMimeTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/quicktime', 'video/x-msvideo'
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return { isValid: false, error: 'Invalid file type. Only images and videos are allowed.' };
  }

  return { isValid: true };
};

// Export types for use in other files
export interface MediaUploadResponse {
  success: boolean;
  message: string;
  data?: {
    url: string;
    filename: string;
    size: number;
    format: string;
    uploadedBy: string;
    uploadedAt: string;
  };
  error?: string;
  details?: string;
}

export interface MultipleMediaUploadResponse {
  success: boolean;
  message: string;
  data?: {
    files: Array<{
      url: string;
      filename: string;
      size: number;
      format: string;
    }>;
    uploadedBy: string;
    uploadedAt: string;
  };
  error?: string;
  details?: string;
}