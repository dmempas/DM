import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import MapView, {Marker} from 'react-native-maps';
import Button from './Button';
import Card from './Card';
import {ReportItemData, ItemCategory} from '../types/items';
import {useAuth} from '../store/AuthContext';
import Colors from '../constants/colors';
import Typography from '../constants/typography';
import Spacing from '../constants/spacing';
import AppConstants from '../constants/app';

interface ReviewStepProps {
  data: Partial<ReportItemData>;
  itemType: 'lost' | 'found';
  onSubmit: () => void;
  isSubmitting?: boolean;
}

const ReviewStep: React.FC<ReviewStepProps> = ({
  data,
  itemType,
  onSubmit,
  isSubmitting = false,
}) => {
  const {user} = useAuth();

  const getCategoryLabel = (category?: ItemCategory): string => {
    const categories: Record<ItemCategory, string> = {
      electronics: 'Electronics',
      jewelry: 'Jewelry',
      documents: 'Documents',
      clothing: 'Clothing',
      accessories: 'Accessories',
      pets: 'Pets',
      other: 'Other',
    };
    return category ? categories[category] : 'Not specified';
  };

  const getContactPreferenceLabel = (preference?: string): string => {
    const preferences: Record<string, string> = {
      inApp: 'In-App Messages',
      phone: 'Phone Call',
      email: 'Email',
    };
    return preference ? preferences[preference] : 'Not specified';
  };

  const validateAndSubmit = () => {
    Alert.alert(
      'Submit Report',
      `Are you sure you want to submit this ${itemType} item report? This will be visible to other users who may have information about your item.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Submit',
          onPress: onSubmit,
          style: 'default',
        },
      ]
    );
  };

  const formatDate = (date?: Date | string): string => {
    if (!date) return 'Not specified';
    if (typeof date === 'string') return date;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatReward = (reward?: number): string => {
    if (!reward) return 'No reward offered';
    return `$${reward.toFixed(2)}`;
  };

  const isFormValid = (): boolean => {
    return !!(
      data.title?.trim() &&
      data.description?.trim() &&
      data.category &&
      data.location?.coordinates?.length === 2 &&
      data.location?.address?.trim() &&
      data.contactPreference
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Review Your Report</Text>
        <Text style={styles.description}>
          Please review all the information below before submitting. You can go back to make changes if needed.
        </Text>

        {/* Item Details Card */}
        <Card margin="sm" padding="md">
          <Text style={styles.cardTitle}>Item Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Title:</Text>
            <Text style={styles.detailValue}>{data.title || 'Not specified'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category:</Text>
            <Text style={styles.detailValue}>{getCategoryLabel(data.category)}</Text>
          </View>

          {data.subcategory && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Subcategory:</Text>
              <Text style={styles.detailValue}>{data.subcategory}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Description:</Text>
            <Text style={styles.detailValue}>{data.description || 'Not specified'}</Text>
          </View>

          {itemType === 'lost' && data.reward && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reward:</Text>
              <Text style={styles.detailValue}>{formatReward(data.reward)}</Text>
            </View>
          )}
        </Card>

        {/* Location Card */}
        {data.location && (
          <Card margin="sm" padding="md">
            <Text style={styles.cardTitle}>Location</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Address:</Text>
              <Text style={styles.detailValue}>{data.location.address}</Text>
            </View>

            {data.location.description && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Details:</Text>
                <Text style={styles.detailValue}>{data.location.description}</Text>
              </View>
            )}

            {data.location.city && data.location.state && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>City:</Text>
                <Text style={styles.detailValue}>
                  {data.location.city}, {data.location.state}
                </Text>
              </View>
            )}

            {/* Map Preview */}
            <View style={styles.mapPreview}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: data.location.coordinates[1],
                  longitude: data.location.coordinates[0],
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}>
                <Marker
                  coordinate={{
                    latitude: data.location.coordinates[1],
                    longitude: data.location.coordinates[0],
                  }}
                  pinColor={itemType === 'lost' ? Colors.error : Colors.secondary}
                />
              </MapView>
            </View>
          </Card>
        )}

        {/* Photos Card */}
        {data.photos && data.photos.length > 0 && (
          <Card margin="sm" padding="md">
            <Text style={styles.cardTitle}>Photos ({data.photos.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.photoScroll}>
                {data.photos.map((photoUri, index) => (
                  <Image
                    key={index}
                    source={{uri: photoUri}}
                    style={styles.photoThumbnail}
                  />
                ))}
              </View>
            </ScrollView>
          </Card>
        )}

        {/* Contact Information Card */}
        <Card margin="sm" padding="md">
          <Text style={styles.cardTitle}>Contact Information</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Preferred Contact:</Text>
            <Text style={styles.detailValue}>
              {getContactPreferenceLabel(data.contactPreference)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Your Name:</Text>
            <Text style={styles.detailValue}>{user?.displayName || 'Anonymous'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Your Email:</Text>
            <Text style={styles.detailValue}>{user?.email || 'Not specified'}</Text>
          </View>

          {itemType === 'found' && data.holdingLocation && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Item Located At:</Text>
              <Text style={styles.detailValue}>{data.holdingLocation}</Text>
            </View>
          )}
        </Card>

        {/* Important Information */}
        <Card margin="sm" padding="md" shadow={false}>
          <Text style={styles.importantTitle}>Important Information</Text>
          <Text style={styles.importantText}>
            • Your report will be immediately processed by our matching algorithm
          </Text>
          <Text style={styles.importantText}>
            • You'll receive notifications when we find potential matches
          </Text>
          <Text style={styles.importantText}>
            • You can edit or remove your report at any time
          </Text>
          <Text style={styles.importantText}>
            • Reports are automatically marked as expired after 30 days
          </Text>
          {itemType === 'lost' && (
            <Text style={styles.importantText}>
              • Please update your report if you find your item
            </Text>
          )}
        </Card>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <Button
            title={`Submit ${itemType === 'lost' ? 'Lost' : 'Found'} Item Report`}
            onPress={validateAndSubmit}
            loading={isSubmitting}
            disabled={!isFormValid() || isSubmitting}
            size="large"
          />

          {!isFormValid() && (
            <Text style={styles.validationError}>
              Please complete all required fields before submitting.
            </Text>
          )}
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
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  cardTitle: {
    ...Typography.subtitle,
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    marginBottom: Spacing.md,
    fontWeight: Typography.fontWeight.medium,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
    alignItems: 'flex-start',
  },
  detailLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
    width: 100,
    fontWeight: Typography.fontWeight.medium,
  },
  detailValue: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  mapPreview: {
    height: 150,
    borderRadius: Spacing.borderRadius.md,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  map: {
    flex: 1,
  },
  photoScroll: {
    flexDirection: 'row',
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: Spacing.borderRadius.sm,
    marginRight: Spacing.sm,
    resizeMode: 'cover',
  },
  importantTitle: {
    ...Typography.subtitle,
    fontSize: Typography.fontSize.sm,
    color: Colors.warning,
    marginBottom: Spacing.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  importantText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    paddingLeft: Spacing.sm,
  },
  submitContainer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  validationError: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});

export default ReviewStep;