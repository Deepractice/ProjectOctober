import React from 'react';
import { ImageAttachment } from '../MessageRenderer';

/**
 * ImageAttachments component - Displays attached images and drag-and-drop overlay
 * @param {Object} props
 * @param {Array} props.attachedImages - Array of attached image files
 * @param {Map} props.uploadingImages - Map of uploading progress for each image
 * @param {Map} props.imageErrors - Map of errors for each image
 * @param {Function} props.onRemoveImage - Callback when image is removed
 * @param {boolean} props.isDragActive - Whether drag is active
 */
function ImageAttachments({
  attachedImages = [],
  uploadingImages = new Map(),
  imageErrors = new Map(),
  onRemoveImage,
  isDragActive = false
}) {
  return (
    <>
      {/* Drag overlay */}
      {isDragActive && (
        <div className="absolute inset-0 bg-blue-500/20 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
            <svg className="w-8 h-8 text-blue-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm font-medium">Drop images here</p>
          </div>
        </div>
      )}

      {/* Image attachments preview */}
      {attachedImages.length > 0 && (
        <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex flex-wrap gap-2">
            {attachedImages.map((file, index) => (
              <ImageAttachment
                key={index}
                file={file}
                onRemove={() => onRemoveImage(index)}
                uploadProgress={uploadingImages.get(file.name)}
                error={imageErrors.get(file.name)}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default ImageAttachments;
