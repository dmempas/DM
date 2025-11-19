import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import {launchImageLibrary, MediaType, ImagePickerResponse} from 'react-native-image-picker';
import Input from './Input';
import Button from './Button';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {ReportItemData} from '../types/items';
import Colors from '../constants/colors';
import Typography from '../constants/typography';
import Spacing from '../constants/spacing';
import AppConstants from '../constants/app';

interface Photo {
  uri: string;
  type: string;
  fileName: string;
  fileSize?: number;
}

interface PhotosStepProps {
  data: Partial<ReportItemData>;
  onChange: (data: Partial<ReportItemData>) => void;
  itemType: 'lost' | 'found';
}

const PhotosStep: React.FC<PhotosStepProps> = ({
  data,
  onChange,
  itemType,
}) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [errors, setErrors] = useState<string>('');

  useEffect(() => {
    if (data.photos && data.photos.length > 0) {
      // Convert stored URLs back to Photo objects for display
      const photoObjects = data.photos.map((url, index) => ({
        uri: url,
        type: 'image/jpeg',
        fileName: `photo_${index}.jpg`,
      }));
      setPhotos(photoObjects);
    }
  }, [data.photos]);

  const selectPhotos = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: false,
      maxHeight: AppConstants.imageUpload.maxHeight,
      maxWidth: AppConstants.imageUpload.maxWidth,
      quality: AppConstants.imageUpload.quality,
      selectionLimit: Math.max(1, AppConstants.defaults.maxPhotos - photos.length),
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const validAssets = response.assets.filter(
          (asset) =>
            asset.uri &&
            asset.type?.startsWith('image/') &&
            (!asset.fileSize ||
              asset.fileSize <= AppConstants.imageUpload.maxFileSize)
        );

        if (validAssets.length === 0) {
          Alert.alert(
            'Invalid Images',
            'Please select valid image files under 5MB each.'
          );
          return;
        }

        if (photos.length + validAssets.length > AppConstants.defaults.maxPhotos) {
          Alert.alert(
            'Too Many Photos',
            `You can only add up to ${AppConstants.defaults.maxPhotos} photos.`
          );
          return;
        }

        const newPhotos: Photo[] = validAssets.map((asset) => ({
          uri: asset.uri!,
          type: asset.type!,
          fileName: asset.fileName || `photo_${Date.now()}.jpg`,
          fileSize: asset.fileSize,
        }));

        const updatedPhotos = [...photos, ...newPhotos];
        setPhotos(updatedPhotos);
        handlePhotosChange(updatedPhotos);

        setErrors('');
      }
    });
  };

  const removePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    setPhotos(updatedPhotos);
    handlePhotosChange(updatedPhotos);
  };

  const handlePhotosChange = (updatedPhotos: Photo[]) => {
    const photoUrls = updatedPhotos.map((photo) => photo.uri);
    onChange({
      ...data,
      photos: photoUrls,
    });

    if (errors) {
      setErrors('');
    }
  };

  const movePhoto = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const updatedPhotos = [...photos];
    const [movedPhoto] = updatedPhotos.splice(fromIndex, 1);
    updatedPhotos.splice(toIndex, 0, movedPhoto);

    setPhotos(updatedPhotos);
    handlePhotosChange(updatedPhotos);
  };

  const validateStep = (): boolean => {
    // Photos are optional, but if provided, validate them
    if (photos.length > 0) {
      const invalidPhotos = photos.filter(
        (photo) => !photo.uri || !photo.type?.startsWith('image/')
      );

      if (invalidPhotos.length > 0) {
        setErrors('Some photos are invalid. Please remove them and try again.');
        return false;
      }
    }

    setErrors('');
    return true;
  };

  useEffect(() => {
    (global as any).validateStep3 = validateStep;
    return () => {
      delete (global as any).validateStep3;
    };
  }, [photos, errors]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>
          Add Photos (Optional)
        </Text>

        <Text style={styles.description}>
          Adding photos helps others identify your item. Clear photos increase the chances of finding your {itemType === 'lost' ? 'lost' : 'found'} item.
        </Text>

        <Button
          title="Add Photos"
          onPress={selectPhotos}
          disabled={photos.length >= AppConstants.defaults.maxPhotos}
          icon={<Icon name="add-photo-alternate" size={20} color={Colors.background} />}
          style={styles.addButton}
        />

        <View style={styles.photoGrid}>
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoContainer}>
              <Image source={{uri: photo.uri}} style={styles.photo} />

              <View style={styles.photoOverlay}>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removePhoto(index)}>
                  <Icon name="close" size={20} color={Colors.background} />
                </TouchableOpacity>

                <View style={styles.photoIndex}>
                  <Text style={styles.photoIndexText}>{index + 1}</Text>
                </View>
              </View>
            </View>
          ))}

          {photos.length < AppConstants.defaults.maxPhotos && (
            <TouchableOpacity
              style={[styles.photoContainer, styles.addPhotoPlaceholder]}
              onPress={selectPhotos}>
              <Icon name="add-photo-alternate" size={40} color={Colors.neutral} />
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {errors ? (
          <Text style={styles.errorText}>{errors}</Text>
        ) : null}

        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Photo Tips:</Text>
          <Text style={styles.tip}>• Take clear, well-lit photos</Text>
          <Text style={styles.tip}>• Show distinctive features</Text>
          <Text style={styles.tip}>• Include multiple angles if possible</Text>
          <Text style={styles.tip}>• Avoid blurry or dark images</Text>
          <Text style={styles.tip}>
            • Maximum {AppConstants.defaults.maxPhotos} photos allowed
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.screen.horizontal,
  },
  sectionTitle: {
    ...Typography.subtitle,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  addButton: {
    marginBottom: Spacing.lg,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
    marginBottom: Spacing.lg,
  },
  photoContainer: {
    width: '48%',
    aspectRatio: 1,
    marginHorizontal: Spacing.xs,
    marginBottom: Spacing.sm,
    borderRadius: Spacing.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  addPhotoPlaceholder: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'space-between',
  },
  removeButton: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: Colors.error,
    borderRadius: Spacing.borderRadius.full,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoIndex: {
    position: 'absolute',
    bottom: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: Colors.primary,
    borderRadius: Spacing.borderRadius.full,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoIndexText: {
    ...Typography.caption,
    color: Colors.background,
    fontSize: 10,
    fontWeight: 'bold',
  },
  addPhotoText: {
    ...Typography.caption,
    color: Colors.neutral,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginBottom: Spacing.md,
  },
  tipsContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Spacing.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
  },
  tipsTitle: {
    ...Typography.subtitle,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  tip: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
});

export default PhotosStep;