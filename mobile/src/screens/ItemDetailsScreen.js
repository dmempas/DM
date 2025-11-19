import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Linking,
  Share,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { itemsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ItemDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { itemId } = route.params;
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItemDetails();
  }, [itemId]);

  const loadItemDetails = async () => {
    try {
      setLoading(true);
      const response = await itemsAPI.getItem(itemId);
      setItem(response.data.data);
    } catch (error) {
      console.error('Load item details error:', error);
      Alert.alert('Error', 'Failed to load item details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleClaimItem = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to claim this item');
      return;
    }

    if (item.item_type !== 'lost') {
      Alert.alert('Cannot Claim', 'Only lost items can be claimed');
      return;
    }

    if (item.status !== 'unclaimed') {
      Alert.alert('Cannot Claim', 'This item is no longer available for claiming');
      return;
    }

    if (item.user_claim) {
      Alert.alert('Already Claimed', 'You have already claimed this item');
      return;
    }

    navigation.navigate('ClaimItem', { itemId });
  };

  const handleContactReporter = () => {
    if (item.reporter_email) {
      Alert.alert(
        'Contact Reporter',
        `Would you like to email ${item.reporter_name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Email',
            onPress: () => {
              Linking.openURL(`mailto:${item.reporter_email}?subject=Regarding your lost/found item: ${item.title}`);
            },
          },
        ]
      );
    }
  };

  const handleShareItem = async () => {
    try {
      await Share.share({
        message: `Check out this ${item.item_type} item: ${item.title}\n\n${item.description}\n\nLocation: ${item.last_location || 'Not specified'}`,
        title: `${item.item_type === 'lost' ? 'Lost' : 'Found'} Item: ${item.title}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'unclaimed': return '#51cf66';
      case 'pending_verification': return '#ffd43b';
      case 'claimed': return '#339af0';
      case 'verified': return '#845ef7';
      default: return '#868e96';
    }
  };

  const getStatusText = (status) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading item details...</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.errorContainer}>
        <Text>Item not found</Text>
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
        <Text style={styles.title}>Item Details</Text>
        <TouchableOpacity onPress={handleShareItem} style={styles.shareButton}>
          <Icon name="share" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Item Type and Category */}
        <View style={styles.typeSection}>
          <View style={[styles.typeBadge, { backgroundColor: item.item_type === 'lost' ? '#ff6b6b' : '#51cf66' }]}>
            <Text style={styles.typeText}>{item.item_type.toUpperCase()}</Text>
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category.replace('_', ' ').toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.itemTitle}>{item.title}</Text>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>

        {/* Location */}
        {item.last_location && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationRow}>
              <Icon name="location-on" size={20} color="#2196F3" />
              <Text style={styles.locationText}>{item.last_location}</Text>
            </View>
          </View>
        )}

        {/* Date and Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date & Time</Text>
          <View style={styles.dateRow}>
            <Icon name="schedule" size={20} color="#2196F3" />
            <Text style={styles.dateText}>
              {new Date(item.date_time_lost_found).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Photos */}
        {item.photos && item.photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos ({item.photos.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {item.photos.map((photo, index) => (
                <TouchableOpacity key={index} onPress={() => {/* Add image viewer */ }}>
                  <Image source={{ uri: photo.photo_url }} style={styles.photo} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Reporter Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reported By</Text>
          <View style={styles.reporterInfo}>
            <View style={styles.avatar}>
              <Icon name="person" size={24} color="#666" />
            </View>
            <View style={styles.reporterDetails}>
              <Text style={styles.reporterName}>{item.reporter_name}</Text>
              <Text style={styles.reporterDate}>
                Reported on {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Verification Questions (for lost items) */}
        {item.item_type === 'lost' && item.verification_questions && item.verification_questions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Verification Required</Text>
            <Text style={styles.verificationInfo}>
              You'll need to answer {item.verification_questions.length} question(s) to claim this item
            </Text>
            {item.verification_questions.map((question, index) => (
              <View key={index} style={styles.verificationQuestion}>
                <Icon name="help-outline" size={16} color="#2196F3" />
                <Text style={styles.questionText}>{question.question}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Claim Status (if user has claimed) */}
        {item.user_claim && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Claim Status</Text>
            <View style={[styles.claimStatus, { backgroundColor: getStatusColor(item.user_claim.status) }]}>
              <Icon name="info" size={20} color="white" />
              <Text style={styles.claimStatusText}>
                {getStatusText(item.user_claim.status)}
              </Text>
            </View>
            {item.user_claim.claimed_at && (
              <Text style={styles.claimDate}>
                Claimed on {new Date(item.user_claim.claimed_at).toLocaleDateString()}
              </Text>
            )}
          </View>
        )}

        {/* Action Buttons */}
        {item.item_type === 'lost' && item.status === 'unclaimed' && (
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={[
                styles.claimButton,
                (!user || item.user_claim) && styles.claimButtonDisabled
              ]}
              onPress={handleClaimItem}
              disabled={!user || !!item.user_claim}
            >
              <Icon name="claim" size={20} color="white" />
              <Text style={styles.claimButtonText}>
                {item.user_claim ? 'Already Claimed' : 'Claim This Item'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleContactReporter}
            >
              <Icon name="email" size={20} color="#2196F3" />
              <Text style={styles.contactButtonText}>Contact Reporter</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Safety Tips */}
        <View style={styles.safetySection}>
          <Text style={styles.safetyTitle}>🔒 Safety Tips</Text>
          <Text style={styles.safetyTip}>
            • Meet in a public, safe location for item exchange
          </Text>
          <Text style={styles.safetyTip}>
            • Verify the item details before claiming
          </Text>
          <Text style={styles.safetyTip}>
            • Bring identification if required
          </Text>
          <Text style={styles.safetyTip}>
            • Never share personal or financial information
          </Text>
        </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  shareButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  typeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoryBadge: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: '#666',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  photo: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginRight: 12,
  },
  reporterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reporterDetails: {
    flex: 1,
  },
  reporterName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  reporterDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  verificationInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  verificationQuestion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  claimStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  claimStatusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  claimDate: {
    fontSize: 12,
    color: '#666',
  },
  actionSection: {
    marginBottom: 16,
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  claimButtonDisabled: {
    backgroundColor: '#ccc',
  },
  claimButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
  },
  contactButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  safetySection: {
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 12,
  },
  safetyTip: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 6,
    paddingLeft: 4,
  },
});

export default ItemDetailsScreen;