import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Picker,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { itemsAPI, uploadAPI } from '../services/api';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import PhotoUpload from '../components/PhotoUpload';
import LocationPicker from '../components/LocationPicker';
import VerificationQuestions from '../components/VerificationQuestions';

const ReportItemScreen = () => {
  const navigation = useNavigation();
  const [itemType, setItemType] = useState('lost');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    last_location: '',
    date_time_lost_found: new Date(),
    latitude: null,
    longitude: null,
  });
  const [photos, setPhotos] = useState([]);
  const [verificationQuestions, setVerificationQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const categories = [
    { key: 'gadgets', label: 'Gadgets' },
    { key: 'school_supplies', label: 'School Supplies' },
    { key: 'ids', label: 'IDs' },
    { key: 'wallets', label: 'Wallets' },
    { key: 'clothes', label: 'Clothes' },
    { key: 'other', label: 'Other' },
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoSelect = () => {
    Alert.alert(
      'Add Photo',
      'Choose a photo source',
      [
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Gallery', onPress: () => openGallery() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const openCamera = () => {
    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1080,
        maxHeight: 1080,
      },
      handlePhotoResponse
    );
  };

  const openGallery = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1080,
        maxHeight: 1080,
        selectionLimit: 5 - photos.length,
      },
      handlePhotoResponse
    );
  };

  const handlePhotoResponse = (response) => {
    if (response.didCancel || response.error) return;

    const newPhotos = response.assets.map(asset => ({
      uri: asset.uri,
      name: asset.fileName || `photo_${Date.now()}.jpg`,
      type: asset.type || 'image/jpeg',
    }));

    if (photos.length + newPhotos.length > 5) {
      Alert.alert('Error', 'Maximum 5 photos allowed');
      return;
    }

    setPhotos(prev => [...prev, ...newPhotos]);
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleLocationSelect = (location) => {
    setFormData(prev => ({
      ...prev,
      last_location: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
    }));
    setShowLocationPicker(false);
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        date_time_lost_found: selectedDate,
      }));
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter item title');
      return false;
    }

    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter item description');
      return false;
    }

    if (itemType === 'found' && photos.length === 0) {
      Alert.alert('Error', 'At least one photo is required for found items');
      return false;
    }

    if (itemType === 'lost' && verificationQuestions.length === 0) {
      Alert.alert('Error', 'Please add at least one verification question for lost items');
      return false;
    }

    return true;
  };

  const uploadPhotos = async () => {
    const uploadedPhotos = [];

    for (const photo of photos) {
      const formData = new FormData();
      formData.append('image', {
        uri: photo.uri,
        name: photo.name,
        type: photo.type,
      });

      try {
        const response = await uploadAPI.uploadImage(formData);
        uploadedPhotos.push({
          photo_url: response.data.data.url,
          public_id: response.data.data.public_id,
        });
      } catch (error) {
        console.error('Photo upload error:', error);
        throw new Error('Failed to upload photos');
      }
    }

    return uploadedPhotos;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      let uploadedPhotos = [];
      if (photos.length > 0) {
        uploadedPhotos = await uploadPhotos();
      }

      const itemData = {
        ...formData,
        item_type: itemType,
        photos: uploadedPhotos,
        verification_questions: itemType === 'lost' ? verificationQuestions : [],
      };

      const response = await itemsAPI.createItem(itemData);

      Alert.alert(
        'Success!',
        `${itemType === 'lost' ? 'Lost' : 'Found'} item reported successfully`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Failed to report item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Report {itemType === 'lost' ? 'Lost' : 'Found'} Item</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Item Type Selector */}
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeButton, itemType === 'lost' && styles.typeButtonActive]}
            onPress={() => setItemType('lost')}
          >
            <Icon name="search-off" size={20} color={itemType === 'lost' ? '#fff' : '#666'} />
            <Text style={[styles.typeButtonText, itemType === 'lost' && styles.typeButtonTextActive]}>
              Lost Item
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, itemType === 'found' && styles.typeButtonActive]}
            onPress={() => setItemType('found')}
          >
            <Icon name="find-in-page" size={20} color={itemType === 'found' ? '#fff' : '#666'} />
            <Text style={[styles.typeButtonText, itemType === 'found' && styles.typeButtonTextActive]}>
              Found Item
            </Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Item Title *</Text>
          <TextInput
            style={styles.input}
            value={formData.title}
            onChangeText={(value) => handleInputChange('title', value)}
            placeholder="What is the item?"
            maxLength={100}
          />
        </View>

        {/* Category */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.category}
              onValueChange={(value) => handleInputChange('category', value)}
              style={styles.picker}
            >
              {categories.map((category) => (
                <Picker.Item key={category.key} label={category.label} value={category.key} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            placeholder="Describe the item in detail..."
            multiline
            numberOfLines={4}
            maxLength={500}
          />
        </View>

        {/* Location */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {itemType === 'lost' ? 'Last Seen Location' : 'Where Found'} *
          </Text>
          <TouchableOpacity
            style={styles.locationInput}
            onPress={() => setShowLocationPicker(true)}
          >
            <Icon name="location-on" size={20} color="#2196F3" />
            <Text style={styles.locationText}>
              {formData.last_location || 'Select location'}
            </Text>
            <Icon name="chevron-right" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Date/Time */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {itemType === 'lost' ? 'When Lost' : 'When Found'} *
          </Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowDatePicker(true)}
          >
            <Icon name="event" size={20} color="#2196F3" />
            <Text style={styles.dateText}>
              {formData.date_time_lost_found.toLocaleDateString()} {' '}
              {formData.date_time_lost_found.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Icon name="chevron-right" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Photos */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Photos {itemType === 'found' && '*'} ({photos.length}/5)
          </Text>
          <PhotoUpload
            photos={photos}
            onPhotoSelect={handlePhotoSelect}
            onRemovePhoto={removePhoto}
            maxPhotos={5}
          />
        </View>

        {/* Verification Questions (for lost items) */}
        {itemType === 'lost' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Verification Questions *</Text>
            <Text style={styles.helperText}>
              Add questions that only the true owner can answer
            </Text>
            <VerificationQuestions
              questions={verificationQuestions}
              onQuestionsChange={setVerificationQuestions}
            />
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Submitting...' : `Report ${itemType === 'lost' ? 'Lost' : 'Found'} Item`}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.date_time_lost_found}
          mode="datetime"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* Location Picker Modal */}
      <Modal
        visible={showLocationPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLocationPicker(false)}
      >
        <LocationPicker
          onLocationSelect={handleLocationSelect}
          onClose={() => setShowLocationPicker(false)}
          initialLocation={{
            latitude: formData.latitude,
            longitude: formData.longitude,
            address: formData.last_location,
          }}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 6,
  },
  typeButtonActive: {
    backgroundColor: '#2196F3',
  },
  typeButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  typeButtonTextActive: {
    color: 'white',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  picker: {
    height: 50,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  submitButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ReportItemScreen;