import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { claimsAPI, itemsAPI, uploadAPI } from '../services/api';

const ClaimItemScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { itemId } = route.params;

  const [item, setItem] = useState(null);
  const [verificationQuestions, setVerificationQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [proofPhoto, setProofPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadItemDetails();
  }, [itemId]);

  const loadItemDetails = async () => {
    try {
      setLoading(true);

      // Get item details with verification questions
      const [itemResponse, verificationResponse] = await Promise.all([
        itemsAPI.getItem(itemId),
        claimsAPI.getClaimVerification(itemId),
      ]);

      setItem(itemResponse.data.data);
      setVerificationQuestions(verificationResponse.data.data.verification_questions || []);

      // Initialize answers object
      const initialAnswers = {};
      verificationResponse.data.data.verification_questions.forEach((question, index) => {
        initialAnswers[index] = '';
      });
      setAnswers(initialAnswers);
    } catch (error) {
      console.error('Load item details error:', error);
      Alert.alert('Error', 'Failed to load item details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: value,
    }));
  };

  const handleProofPhotoSelect = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1080,
        maxHeight: 1080,
      },
      (response) => {
        if (response.didCancel || response.error) return;

        const asset = response.assets[0];
        setProofPhoto({
          uri: asset.uri,
          name: asset.fileName || `proof_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
        });
      }
    );
  };

  const removeProofPhoto = () => {
    setProofPhoto(null);
  };

  const validateForm = () => {
    // Check if all required text questions are answered
    const textQuestions = verificationQuestions.filter(q => q.question_type === 'text');
    for (const question of textQuestions) {
      const index = verificationQuestions.indexOf(question);
      if (!answers[index] || answers[index].trim() === '') {
        Alert.alert('Error', `Please answer: ${question.question}`);
        return false;
      }
    }

    // Check if photo proof is required (for photo questions)
    const photoQuestions = verificationQuestions.filter(q => q.question_type === 'photo');
    if (photoQuestions.length > 0 && !proofPhoto) {
      Alert.alert('Error', 'Please upload a proof photo');
      return false;
    }

    return true;
  };

  const uploadProofPhoto = async () => {
    if (!proofPhoto) return null;

    const formData = new FormData();
    formData.append('image', {
      uri: proofPhoto.uri,
      name: proofPhoto.name,
      type: proofPhoto.type,
    });

    try {
      const response = await uploadAPI.uploadImage(formData);
      return response.data.data.url;
    } catch (error) {
      console.error('Photo upload error:', error);
      throw new Error('Failed to upload proof photo');
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      let proofPhotoUrl = null;
      if (proofPhoto) {
        proofPhotoUrl = await uploadProofPhoto();
      }

      const claimData = {
        item_id: itemId,
        verification_answers: answers,
        proof_photo_url: proofPhotoUrl,
      };

      const response = await claimsAPI.createClaim(claimData);

      Alert.alert(
        'Claim Submitted!',
        'Your claim has been submitted successfully. The item reporter will review your claim and verify your answers.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Submit claim error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error?.message || 'Failed to submit claim'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading item details...</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={64} color="#ff4444" />
        <Text style={styles.errorText}>Item not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Claim Item</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Item Preview */}
        <View style={styles.itemPreview}>
          <View style={styles.itemHeader}>
            <View style={[styles.itemTypeBadge, { backgroundColor: '#ff6b6b' }]}>
              <Text style={styles.itemTypeText}>LOST</Text>
            </View>
            <Text style={styles.categoryText}>{item.category.replace('_', ' ').toUpperCase()}</Text>
          </View>

          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemDescription}>{item.description}</Text>

          {item.last_location && (
            <View style={styles.locationRow}>
              <Icon name="location-on" size={16} color="#666" />
              <Text style={styles.locationText}>{item.last_location}</Text>
            </View>
          )}

          {item.photos && item.photos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosContainer}>
              {item.photos.map((photo, index) => (
                <Image key={index} source={{ uri: photo.photo_url }} style={styles.itemPhoto} />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Verification Section */}
        <View style={styles.verificationSection}>
          <Text style={styles.sectionTitle}>Verification Questions</Text>
          <Text style={styles.sectionSubtitle}>
            Please answer these questions to prove you are the rightful owner
          </Text>

          {verificationQuestions.length === 0 ? (
            <View style={styles.noQuestionsContainer}>
              <Icon name="info-outline" size={48} color="#666" />
              <Text style={styles.noQuestionsText}>
                No verification questions required for this item
              </Text>
            </View>
          ) : (
            verificationQuestions.map((question, index) => (
              <View key={index} style={styles.questionContainer}>
                <View style={styles.questionHeader}>
                  <Icon name="help-outline" size={20} color="#2196F3" />
                  <Text style={styles.questionText}>{question.question}</Text>
                </View>

                {question.question_type === 'text' && (
                  <TextInput
                    style={styles.answerInput}
                    value={answers[index] || ''}
                    onChangeText={(value) => handleAnswerChange(index, value)}
                    placeholder="Enter your answer..."
                    multiline
                    numberOfLines={3}
                  />
                )}

                {question.question_type === 'photo' && (
                  <View style={styles.photoAnswerContainer}>
                    <Text style={styles.photoAnswerLabel}>Upload proof photo:</Text>
                    {proofPhoto ? (
                      <View style={styles.proofPhotoContainer}>
                        <Image source={{ uri: proofPhoto.uri }} style={styles.proofPhoto} />
                        <TouchableOpacity
                          style={styles.removePhotoButton}
                          onPress={removeProofPhoto}
                        >
                          <Icon name="close" size={20} color="white" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.uploadPhotoButton} onPress={handleProofPhotoSelect}>
                        <Icon name="add-a-photo" size={24} color="#2196F3" />
                        <Text style={styles.uploadPhotoText}>Upload Proof Photo</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {question.expected_answer && (
                  <Text style={styles.expectedAnswerHint}>
                    💡 Hint: The answer should match this item's specific details
                  </Text>
                )}
              </View>
            ))
          )}
        </View>

        {/* Claim Info */}
        <View style={styles.claimInfoSection}>
          <Text style={styles.sectionTitle}>Claim Information</Text>
          <View style={styles.infoRow}>
            <Icon name="info-outline" size={16} color="#666" />
            <Text style={styles.infoText}>
              Your claim will be reviewed by the person who reported this lost item
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="schedule" size={16} color="#666" />
            <Text style={styles.infoText}>
              You will receive a notification once your claim is reviewed
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Icon name="check-circle" size={20} color="white" />
              <Text style={styles.submitButtonText}>Submit Claim</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  itemPreview: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  itemTypeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  categoryText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  itemTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  photosContainer: {
    marginTop: 8,
  },
  itemPhoto: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
  },
  verificationSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  noQuestionsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noQuestionsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  questionContainer: {
    marginBottom: 20,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  answerInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  photoAnswerContainer: {
    marginTop: 8,
  },
  photoAnswerLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  proofPhotoContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  proofPhoto: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ff4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
  },
  uploadPhotoText: {
    fontSize: 16,
    color: '#2196F3',
    marginLeft: 8,
  },
  expectedAnswerHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  claimInfoSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default ClaimItemScreen;