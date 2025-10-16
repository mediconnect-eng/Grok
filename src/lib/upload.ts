/**
 * File Upload Service for MediConnect
 * Handles document uploads (license certificates, medical documents, etc.)
 * Uses Cloudinary for cloud storage
 */

import { v2 as cloudinary } from 'cloudinary';
import { logInfo, logError } from './logger';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

// Check if Cloudinary is configured
const isConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (!isConfigured && process.env.NODE_ENV === 'development') {
  console.warn('⚠️  Cloudinary not configured. File uploads will be simulated.');
  console.warn('   Set CLOUDINARY_* environment variables in .env.local');
}

/**
 * Upload file to Cloudinary
 * @param file - File buffer or base64 string
 * @param folder - Folder name in Cloudinary (e.g., 'licenses', 'documents')
 * @param filename - Custom filename (optional)
 * @returns Cloudinary URL of uploaded file
 */
export async function uploadFile(
  file: Buffer | string,
  folder: string = 'documents',
  filename?: string
): Promise<string> {
  try {
    if (!isConfigured) {
      // Simulate upload in development
      const mockUrl = `https://mock-storage.mediconnect.com/${folder}/${filename || 'document'}.pdf`;
      logInfo(`[SIMULATED] File upload: ${mockUrl}`);
      return mockUrl;
    }

    // Ensure file is always a string (base64 data URI)
    let fileData: string;
    if (Buffer.isBuffer(file)) {
      fileData = `data:application/pdf;base64,${file.toString('base64')}`;
    } else {
      fileData = file;
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(fileData, {
      folder: `mediconnect/${folder}`,
      public_id: filename,
      resource_type: 'auto', // Automatically detect file type
      overwrite: false,
    });

    logInfo(`File uploaded successfully: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    logError('File upload failed:', error);
    throw new Error('Failed to upload file');
  }
}

/**
 * Upload medical license document
 * @param file - File buffer or base64
 * @param userId - User ID for tracking
 * @param licenseNumber - License number for filename
 * @returns URL of uploaded document
 */
export async function uploadLicenseDocument(
  file: Buffer | string,
  userId: string,
  licenseNumber: string
): Promise<string> {
  const sanitizedLicense = licenseNumber.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `license_${userId}_${sanitizedLicense}_${Date.now()}`;
  return uploadFile(file, 'licenses', filename);
}

/**
 * Upload medical document (prescription, report, etc.)
 * @param file - File buffer or base64
 * @param userId - User ID
 * @param documentType - Type of document
 * @returns URL of uploaded document
 */
export async function uploadMedicalDocument(
  file: Buffer | string,
  userId: string,
  documentType: string
): Promise<string> {
  const filename = `${documentType}_${userId}_${Date.now()}`;
  return uploadFile(file, 'medical-documents', filename);
}

/**
 * Delete file from Cloudinary
 * @param url - Full URL of the file to delete
 * @returns Success status
 */
export async function deleteFile(url: string): Promise<boolean> {
  try {
    if (!isConfigured) {
      logInfo(`[SIMULATED] File deletion: ${url}`);
      return true;
    }

    // Extract public_id from URL
    const urlParts = url.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    if (uploadIndex === -1) {
      throw new Error('Invalid Cloudinary URL');
    }

    const publicIdWithExtension = urlParts.slice(uploadIndex + 2).join('/');
    const publicId = publicIdWithExtension.split('.')[0];

    await cloudinary.uploader.destroy(publicId);
    logInfo(`File deleted successfully: ${url}`);
    return true;
  } catch (error) {
    logError('File deletion failed:', error);
    return false;
  }
}

/**
 * Validate file before upload
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in MB
 * @param allowedTypes - Allowed MIME types
 * @returns Validation result
 */
export function validateFile(
  file: { size: number; type: string },
  maxSizeMB: number = 5,
  allowedTypes: string[] = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
): { valid: boolean; error?: string } {
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Get file info from Cloudinary URL
 * @param url - Cloudinary URL
 * @returns File information
 */
export function getFileInfo(url: string): {
  filename: string;
  folder: string;
  extension: string;
} | null {
  try {
    const urlParts = url.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    if (uploadIndex === -1) return null;

    const pathParts = urlParts.slice(uploadIndex + 2);
    const filenameWithExt = pathParts[pathParts.length - 1];
    const [filename, extension] = filenameWithExt.split('.');
    const folder = pathParts.slice(0, -1).join('/');

    return { filename, folder, extension };
  } catch (error) {
    return null;
  }
}

const uploadService = {
  uploadFile,
  uploadLicenseDocument,
  uploadMedicalDocument,
  deleteFile,
  validateFile,
  getFileInfo,
};

export default uploadService;
