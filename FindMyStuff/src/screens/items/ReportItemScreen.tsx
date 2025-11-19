import React, {useState, useCallback} from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useRoute, RouteProp} from '@react-navigation/native';
import {useFocusEffect} from '@react-navigation/native';
import ItemWizard from '../../components/ItemWizard';
import ItemDetailsStep from '../../components/ItemWizardStep1';
import LocationStep from '../../components/ItemWizardStep2';
import PhotosStep from '../../components/ItemWizardStep3';
import ContactStep from '../../components/ItemWizardStep4';
import ReviewStep from '../../components/ItemWizardStep5';
import {ReportItemData, ItemCategory} from '../../types/items';
import {useAuth} from '../../store/AuthContext';
import FirebaseService from '../../services/firebase';
import Colors from '../../constants/colors';
import Spacing from '../constants/spacing';

type ReportItemRouteProp = RouteProp<{params: {itemType: 'lost' | 'found'}}, 'params'>;
type ReportItemNavigationProp = StackNavigationProp<any, 'ReportItem'>;

const ReportItemScreen: React.FC = () => {
  const route = useRoute<ReportItemRouteProp>();
  const navigation = useNavigation<ReportItemNavigationProp>();
  const {itemType} = route.params;
  const {user} = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [itemData, setItemData] = useState<Partial<ReportItemData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setItemData({});
      setCurrentStep(0);
      setIsSubmitting(false);
    }, [])
  );

  const handleDataChange = (newData: Partial<ReportItemData>) => {
    setItemData(newData);
  };

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };

  const uploadPhotos = async (photoUris: string[]): Promise<string[]> => {
    const uploadPromises = photoUris.map(async (photoUri, index) => {
      try {
        const fileName = `${itemType}_${user!.uid}_${Date.now()}_${index}.jpg`;
        const downloadUrl = await FirebaseService.Storage.uploadImage(photoUri, fileName);
        return downloadUrl;
      } catch (error) {
        console.error(`Error uploading photo ${index}:`, error);
        throw error;
      }
    });

    return Promise.all(uploadPromises);
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to submit a report');
      return;
    }

    try {
      setIsSubmitting(true);

      // Validate final data
      if (!global.validateStep1?.() || !global.validateStep2?.() ||
          !global.validateStep3?.() || !global.validateStep4?.()) {
        Alert.alert('Validation Error', 'Please complete all required fields');
        setIsSubmitting(false);
        return;
      }

      // Upload photos if any
      let photoUrls: string[] = [];
      if (itemData.photos && itemData.photos.length > 0) {
        photoUrls = await uploadPhotos(itemData.photos);
      }

      // Prepare item data
      const now = FirebaseService.Firestore.serverTimestamp();
      const preparedData = {
        ...itemData,
        userId: user.uid,
        photos: photoUrls,
        createdAt: now,
        updatedAt: now,
        status: itemType === 'lost' ? 'active' : 'available',
        isFound: false,
        isClaimed: false,
        tags: generateTags(itemData.description || '', itemData.title || ''),
        location: {
          type: 'Point' as const,
          coordinates: itemData.location!.coordinates,
          address: itemData.location!.address,
          city: itemData.location!.city || '',
          state: itemData.location!.state || '',
          description: itemData.location!.description || '',
        },
        ...(itemType === 'lost' && {
          dateLost: itemData.dateLost ? FirebaseService.Firestore.Timestamp.fromDate(itemData.dateLost) : now,
          reward: itemData.reward || null,
          isFound: false,
        }),
        ...(itemType === 'found' && {
          dateFound: itemData.dateFound ? FirebaseService.Firestore.Timestamp.fromDate(itemData.dateFound) : now,
          holdingLocation: itemData.holdingLocation || '',
          isClaimed: false,
        }),
      };

      // Save to Firestore
      const collection = itemType === 'lost' ? 'lostItems' : 'foundItems';
      await FirebaseService.Firestore[collection].add(preparedData);

      // Update user's last active timestamp
      await FirebaseService.Firestore.users.update(user.uid, {
        lastActiveAt: FirebaseService.Firestore.serverTimestamp(),
      });

      // Success message
      Alert.alert(
        'Report Submitted!',
        `Your ${itemType} item report has been successfully submitted. We'll notify you when we find potential matches.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );

    } catch (error: any) {
      console.error('Error submitting report:', error);
      Alert.alert(
        'Submission Error',
        'There was an error submitting your report. Please try again.',
        [{text: 'OK'}]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateTags = (description: string, title: string): string[] => {
    // Simple tag generation - in production, this could be more sophisticated
    const text = (description + ' ' + title).toLowerCase();
    const words = text.split(/\s+/);
    const commonWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'was', 'were', 'been', 'have', 'has', 'had', 'will', 'would', 'could',
      'should', 'a', 'an', 'is', 'are', 'this', 'that', 'it', 'its'
    ]);

    const tags = words
      .filter(word => word.length > 2 && !commonWords.has(word))
      .slice(0, 10); // Limit to 10 tags

    return [...new Set(tags)]; // Remove duplicates
  };

  const wizardSteps = [
    {
      id: 'details',
      title: 'Item Details',
      component: (
        <ItemDetailsStep
          data={itemData}
          onChange={handleDataChange}
          itemType={itemType}
        />
      ),
      isValid: !!(
        itemData.title?.trim() &&
        itemData.description?.trim() &&
        itemData.category
      ),
    },
    {
      id: 'location',
      title: 'Location',
      component: (
        <LocationStep
          data={itemData}
          onChange={handleDataChange}
          itemType={itemType}
        />
      ),
      isValid: !!(
        itemData.location?.coordinates?.length === 2 &&
        itemData.location?.address?.trim()
      ),
    },
    {
      id: 'photos',
      title: 'Photos',
      component: (
        <PhotosStep
          data={itemData}
          onChange={handleDataChange}
          itemType={itemType}
        />
      ),
      isValid: true, // Photos are optional
    },
    {
      id: 'contact',
      title: 'Contact',
      component: (
        <ContactStep
          data={itemData}
          onChange={handleDataChange}
          itemType={itemType}
        />
      ),
      isValid: !!(
        itemData.contactPreference &&
        (itemType === 'found' ? itemData.holdingLocation?.trim() : true)
      ),
    },
    {
      id: 'review',
      title: 'Review',
      component: (
        <ReviewStep
          data={itemData}
          itemType={itemType}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      ),
      isValid: true, // Review step is always valid for navigation
    },
  ];

  return (
    <View style={styles.container}>
      <ItemWizard
        steps={wizardSteps}
        currentStep={currentStep}
        onStepChange={handleStepChange}
        onComplete={() => {}} // Handled in ReviewStep
        isSubmitting={isSubmitting}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});

export default ReportItemScreen;