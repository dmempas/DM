import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const PhotoUpload = ({ photos, onPhotoSelect, onRemovePhoto, maxPhotos = 5 }) => {
  const handleRemovePhoto = (index) => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => onRemovePhoto(index) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Add Photo Button */}
        {photos.length < maxPhotos && (
          <TouchableOpacity
            style={styles.addPhotoButton}
            onPress={onPhotoSelect}
          >
            <Icon name="add-a-photo" size={32} color="#2196F3" />
            <Text style={styles.addPhotoText}>Add Photo</Text>
          </TouchableOpacity>
        )}

        {/* Photo Grid */}
        {photos.map((photo, index) => (
          <View key={index} style={styles.photoContainer}>
            <Image source={{ uri: photo.uri }} style={styles.photo} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemovePhoto(index)}
            >
              <Icon name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Photo Count */}
      <Text style={styles.photoCount}>
        {photos.length}/{maxPhotos} photos
      </Text>

      {/* Helper Text */}
      <Text style={styles.helperText}>
        {maxPhotos === 1 && photos.length === 0
          ? 'At least one photo is required for found items'
          : `Maximum ${maxPhotos} photos. JPG, PNG, or WebP format. Max 5MB each.`
        }
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  scrollContent: {
    paddingRight: 16,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    marginRight: 8,
  },
  addPhotoText: {
    fontSize: 12,
    color: '#2196F3',
    marginTop: 4,
    textAlign: 'center',
  },
  photoContainer: {
    width: 100,
    height: 100,
    marginRight: 8,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ff4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  photoCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
  },
});

export default PhotoUpload;