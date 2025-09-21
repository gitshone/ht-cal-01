import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import ReactCrop, {
  Crop,
  PixelCrop,
  centerCrop,
  makeAspectCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  currentImage?: string;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  currentImage,
  className = '',
  disabled = false,
  isLoading = false,
}) => {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [showCropModal, setShowCropModal] = useState(false);
  const [localPreview, setLocalPreview] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blobUrlRef = useRef<string>('');

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (currentImage && localPreview) {
      if (currentImage !== localPreview) {
        const timer = setTimeout(() => {
          setLocalPreview('');

          if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current);
            blobUrlRef.current = '';
          }
        }, 500);

        return () => clearTimeout(timer);
      }
    }

    return undefined;
  }, [currentImage, localPreview]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Create immediate preview
      const previewUrl = URL.createObjectURL(file);
      blobUrlRef.current = previewUrl;
      setLocalPreview(previewUrl);

      // Also set up for cropping
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result as string);
        setShowCropModal(true);
      });
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled,
  });

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      const crop = centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 90,
          },
          1,
          width,
          height
        ),
        width,
        height
      );
      setCrop(crop);
    },
    []
  );

  const getCroppedImg = useCallback(
    (image: HTMLImageElement, crop: PixelCrop): Promise<File> => {
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error('Canvas not available');
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const pixelRatio = window.devicePixelRatio;

      canvas.width = crop.width * pixelRatio;
      canvas.height = crop.height * pixelRatio;

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
      );

      return new Promise(resolve => {
        canvas.toBlob(
          blob => {
            if (blob) {
              const file = new File([blob], 'cropped-image.png', {
                type: 'image/png',
              });
              resolve(file);
            }
          },
          'image/png',
          0.9
        );
      });
    },
    []
  );

  const handleCropComplete = useCallback(async () => {
    if (!imgRef.current || !completedCrop) return;

    try {
      const croppedFile = await getCroppedImg(imgRef.current, completedCrop);

      // Clean up previous blob URL if exists
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }

      // Create local preview immediately
      const previewUrl = URL.createObjectURL(croppedFile);
      blobUrlRef.current = previewUrl;
      setLocalPreview(previewUrl);

      // Call the upload function
      onImageSelect(croppedFile);

      setShowCropModal(false);
      setImgSrc('');
      setCrop(undefined);
      setCompletedCrop(undefined);
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  }, [completedCrop, getCroppedImg, onImageSelect]);

  const handleCancelCrop = useCallback(() => {
    setShowCropModal(false);
    setImgSrc('');
    setCrop(undefined);
    setCompletedCrop(undefined);

    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = '';
    }
    setLocalPreview('');
  }, []);

  return (
    <>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200
          ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'hover:border-gray-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          {localPreview || (currentImage && currentImage.trim()) ? (
            <div className="space-y-2">
              <img
                src={localPreview || currentImage}
                alt="Current logo"
                className="mx-auto h-20 w-20 object-cover rounded-lg"
              />
              <p className="text-sm text-gray-600">
                {isLoading
                  ? 'Uploading...'
                  : localPreview
                  ? 'Processing...'
                  : 'Click or drag to replace logo'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="mx-auto h-20 w-20 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-600">
                {isDragActive
                  ? 'Drop the image here'
                  : 'Click or drag to upload logo'}
              </p>
            </div>
          )}
          <p className="text-xs text-gray-500">PNG, JPG, WebP, GIF up to 5MB</p>
        </div>
      </div>

      {/* Crop Modal */}
      {showCropModal && imgSrc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Crop Image</h3>
            <div className="mb-4">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={c => setCompletedCrop(c)}
                aspect={1}
                minWidth={100}
                minHeight={100}
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={imgSrc}
                  onLoad={onImageLoad}
                  className="max-h-96"
                />
              </ReactCrop>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelCrop}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCropComplete}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Crop & Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for cropping */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </>
  );
};
