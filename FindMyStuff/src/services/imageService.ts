import {ImagePickerResponse, MediaType} from 'react-native-image-picker';
import ImageResizer from 'react-native-image-resizer';
import FirebaseService from './firebase';

export interface ProcessedImage {
  uri: string;
  width: number;
  height: number;
  fileSize: number;
  type: string;
  fileName: string;
}

class ImageService {
  /**
   * Select images from device gallery
   */
  async selectImages(
    maxCount: number = 5,
    currentCount: number = 0
  ): Promise<ProcessedImage[]> {
    return new Promise((resolve, reject) => {
      import('react-native-image-picker').then(({launchImageLibrary}) => {
        const options = {
          mediaType: 'photo' as MediaType,
          includeBase64: false,
          selectionLimit: Math.max(1, maxCount - currentCount),
          quality: 0.8,
        };

        launchImageLibrary(options, async (response: ImagePickerResponse) => {
          if (response.didCancel) {
            resolve([]);
            return;
          }

          if (response.errorMessage) {
            reject(new Error(response.errorMessage));
            return;
          }

          if (!response.assets || response.assets.length === 0) {
            resolve([]);
            return;
          }

          try {
            const processedImages = await Promise.all(
              response.assets.map((asset) => this.processImage(asset))
            );
            resolve(processedImages);
          } catch (error) {
            reject(error);
          }
        });
      });
    });
  }

  /**
   * Take photo using camera
   */
  async takePhoto(): Promise<ProcessedImage | null> {
    return new Promise((resolve, reject) => {
      import('react-native-image-picker').then(({launchCamera}) => {
        const options = {
          mediaType: 'photo' as MediaType,
          includeBase64: false,
          quality: 0.8,
          saveToPhotos: false,
        };

        launchCamera(options, async (response: ImagePickerResponse) => {
          if (response.didCancel) {
            resolve(null);
            return;
          }

          if (response.errorMessage) {
            reject(new Error(response.errorMessage));
            return;
          }

          if (!response.assets || response.assets.length === 0) {
            resolve(null);
            return;
          }

          try {
            const processedImage = await this.processImage(response.assets[0]);
            resolve(processedImage);
          } catch (error) {
            reject(error);
          }
        });
      });
    });
  }

  /**
   * Process and resize image
   */
  private async processImage(asset: any): Promise<ProcessedImage> {
    if (!asset.uri) {
      throw new Error('Image URI is missing');
    }

    const maxSize = 1024; // Maximum dimension
    const quality = 80; // JPEG quality

    try {
      let resizedImage;

      // Resize if image is larger than max size
      if (asset.width > maxSize || asset.height > maxSize) {
        resizedImage = await ImageResizer.createResizedImage(
          asset.uri,
          maxSize,
          maxSize,
          'JPEG',
          quality,
          0,
          undefined,
          false,
          {mode: 'contain', onlyScaleDown: true}
        );
      } else {
        resizedImage = {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
        };
      }

      // Get file info
      const fileInfo = await this.getImageInfo(resizedImage.uri);

      return {
        uri: resizedImage.uri,
        width: resizedImage.width,
        height: resizedImage.height,
        fileSize: fileInfo.size || asset.fileSize || 0,
        type: asset.type || 'image/jpeg',
        fileName: asset.fileName || `image_${Date.now()}.jpg`,
      };
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error('Failed to process image');
    }
  }

  /**
   * Get image file information
   */
  private async getImageInfo(uri: string): Promise<{size: number; type: string}> {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return {
        size: blob.size,
        type: blob.type || 'image/jpeg',
      };
    } catch (error) {
      console.warn('Could not get image info:', error);
      return {
        size: 0,
        type: 'image/jpeg',
      };
    }
  }

  /**
   * Upload single image to Firebase Storage
   */
  async uploadImage(
    image: ProcessedImage,
    path: string
  ): Promise<string> {
    try {
      const fileName = `${path}/${Date.now()}_${image.fileName}`;
      const downloadUrl = await FirebaseService.Storage.uploadImage(
        image.uri,
        fileName
      );

      console.log(`Image uploaded successfully: ${fileName}`);
      return downloadUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  }

  /**
   * Upload multiple images to Firebase Storage
   */
  async uploadMultipleImages(
    images: ProcessedImage[],
    path: string
  ): Promise<string[]> {
    const uploadPromises = images.map((image, index) =>
      this.uploadImage(image, `${path}_${index}`)
    );

    try {
      const downloadUrls = await Promise.all(uploadPromises);
      return downloadUrls;
    } catch (error) {
      console.error('Error uploading multiple images:', error);
      throw new Error('Failed to upload one or more images');
    }
  }

  /**
   * Delete image from Firebase Storage
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      await FirebaseService.Storage.deleteFile(imageUrl);
      console.log('Image deleted successfully');
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error('Failed to delete image');
    }
  }

  /**
   * Delete multiple images from Firebase Storage
   */
  async deleteMultipleImages(imageUrls: string[]): Promise<void> {
    const deletePromises = imageUrls.map((url) => this.deleteImage(url));

    try {
      await Promise.allSettled(deletePromises);
      console.log('Bulk delete completed');
    } catch (error) {
      console.error('Error in bulk delete:', error);
      // Don't throw error here as some images might have been deleted successfully
    }
  }

  /**
   * Generate thumbnail for image
   */
  async generateThumbnail(image: ProcessedImage): Promise<ProcessedImage> {
    try {
      const thumbnailSize = 200;
      const thumbnail = await ImageResizer.createResizedImage(
        image.uri,
        thumbnailSize,
        thumbnailSize,
        'JPEG',
        70,
        0,
        undefined,
        false,
        {mode: 'contain', onlyScaleDown: true}
      );

      const fileInfo = await this.getImageInfo(thumbnail.uri);

      return {
        uri: thumbnail.uri,
        width: thumbnail.width,
        height: thumbnail.height,
        fileSize: fileInfo.size,
        type: 'image/jpeg',
        fileName: `thumb_${image.fileName}`,
      };
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      throw new Error('Failed to generate thumbnail');
    }
  }

  /**
   * Validate image before processing
   */
  validateImage(image: any): {isValid: boolean; error?: string} {
    if (!image.uri) {
      return {isValid: false, error: 'Image URI is required'};
    }

    if (!image.type || !image.type.startsWith('image/')) {
      return {isValid: false, error: 'Invalid image format'};
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (image.fileSize && image.fileSize > maxSize) {
      return {isValid: false, error: 'Image size must be less than 5MB'};
    }

    return {isValid: true};
  }

  /**
   * Get image dimensions from URI
   */
  async getImageDimensions(uri: string): Promise<{width: number; height: number}> {
    return new Promise((resolve, reject) => {
      Image.getSize(
        uri,
        (width, height) => {
          resolve({width, height});
        },
        (error) => {
          console.error('Error getting image dimensions:', error);
          reject(new Error('Failed to get image dimensions'));
        }
      );
    });
  }

  /**
   * Create image blob from URI (for debugging)
   */
  async createImageBlob(uri: string): Promise<Blob> {
    try {
      const response = await fetch(uri);
      return response.blob();
    } catch (error) {
      console.error('Error creating blob:', error);
      throw new Error('Failed to create image blob');
    }
  }
}

export default new ImageService();