import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

/**
 * Custom hook for managing image uploads with drag-and-drop and paste support
 *
 * Handles image file validation, upload progress tracking, and error management.
 * Supports drag-and-drop via react-dropzone and clipboard paste.
 *
 * @returns {Object} Image upload state and handlers
 * @property {Array} attachedImages - Array of attached image files
 * @property {Map} uploadingImages - Map of file names to upload progress (0-100)
 * @property {Map} imageErrors - Map of file names to error messages
 * @property {Function} setAttachedImages - Set attached images
 * @property {Function} setUploadingImages - Set upload progress
 * @property {Function} setImageErrors - Set error messages
 * @property {Function} handleImageFiles - Handle dropped/selected files
 * @property {Function} handlePaste - Handle clipboard paste event
 * @property {Object} dropzoneProps - Props for dropzone (getRootProps, getInputProps, isDragActive, open)
 *
 * @example
 * const {
 *   attachedImages,
 *   handlePaste,
 *   dropzoneProps
 * } = useImageUpload();
 */
export const useImageUpload = () => {
  const [attachedImages, setAttachedImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(new Map());
  const [imageErrors, setImageErrors] = useState(new Map());

  /**
   * Handle image files from drag-and-drop or file selection
   * Validates file type and size, filters invalid files
   *
   * @param {Array<File>} files - Array of File objects
   */
  const handleImageFiles = useCallback((files) => {
    const validFiles = files.filter(file => {
      try {
        // Validate file object and properties
        if (!file || typeof file !== 'object') {
          console.warn('Invalid file object:', file);
          return false;
        }

        if (!file.type || !file.type.startsWith('image/')) {
          return false;
        }

        if (!file.size || file.size > 5 * 1024 * 1024) {
          // Safely get file name with fallback
          const fileName = file.name || 'Unknown file';
          setImageErrors(prev => {
            const newMap = new Map(prev);
            newMap.set(fileName, 'File too large (max 5MB)');
            return newMap;
          });
          return false;
        }

        return true;
      } catch (error) {
        console.error('Error validating file:', error, file);
        return false;
      }
    });

    if (validFiles.length > 0) {
      setAttachedImages(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 images
    }
  }, []);

  /**
   * Handle clipboard paste for images
   * Supports both clipboardData.items and clipboardData.files
   *
   * @param {ClipboardEvent} e - Clipboard paste event
   */
  const handlePaste = useCallback(async (e) => {
    const items = Array.from(e.clipboardData.items);

    for (const item of items) {
      if ((item as DataTransferItem).type.startsWith('image/')) {
        const file = (item as DataTransferItem).getAsFile();
        if (file) {
          handleImageFiles([file]);
        }
      }
    }

    // Fallback for some browsers/platforms
    if (items.length === 0 && e.clipboardData.files.length > 0) {
      const files = Array.from(e.clipboardData.files);
      const imageFiles = files.filter(f => (f as DataTransferItem).type.startsWith('image/'));
      if (imageFiles.length > 0) {
        handleImageFiles(imageFiles);
      }
    }
  }, [handleImageFiles]);

  /**
   * Setup react-dropzone for drag-and-drop functionality
   * Configured for image files only, max 5 files, max 5MB per file
   */
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 5,
    onDrop: handleImageFiles,
    noClick: true, // We'll use our own button
    noKeyboard: true
  });

  return {
    attachedImages,
    uploadingImages,
    imageErrors,
    setAttachedImages,
    setUploadingImages,
    setImageErrors,
    handleImageFiles,
    handlePaste,
    dropzoneProps: {
      getRootProps,
      getInputProps,
      isDragActive,
      open
    }
  };
};
