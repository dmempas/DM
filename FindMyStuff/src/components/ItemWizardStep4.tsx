import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import Input from './Input';
import Button from './Button';
import Card from './Card';
import {ReportItemData, ContactPreference} from '../types/items';
import {useAuth} from '../store/AuthContext';
import Colors from '../constants/colors';
import Typography from '../constants/typography';
import Spacing from '../constants/spacing';

interface ContactStepProps {
  data: Partial<ReportItemData>;
  onChange: (data: Partial<ReportItemData>) => void;
  itemType: 'lost' | 'found';
}

const ContactStep: React.FC<ContactStepProps> = ({
  data,
  onChange,
  itemType,
}) => {
  const {user} = useAuth();
  const [errors, setErrors] = useState<{
    contactPreference?: string;
    holdingLocation?: string;
  }>({});

  const contactOptions = [
    {
      value: 'inApp' as ContactPreference,
      title: 'In-App Messages',
      description: 'Communicate through the app chat',
      icon: 'message',
      recommended: true,
    },
    {
      value: 'phone' as ContactPreference,
      title: 'Phone Call',
      description: user?.phoneNumber || 'Add phone number to profile',
      icon: 'phone',
      recommended: false,
    },
    {
      value: 'email' as ContactPreference,
      title: 'Email',
      description: user?.email || 'Use your email address',
      icon: 'email',
      recommended: false,
    },
  ];

  useEffect(() => {
    // Set default contact preference
    if (!data.contactPreference) {
      onChange({
        ...data,
        contactPreference: 'inApp',
      });
    }
  }, []);

  const handleContactPreferenceSelect = (preference: ContactPreference) => {
    const newData = {
      ...data,
      contactPreference: preference,
    };
    onChange(newData);

    if (errors.contactPreference) {
      setErrors(prev => ({...prev, contactPreference: undefined}));
    }

    // Show warning for non-inApp preferences
    if (preference !== 'inApp') {
      Alert.alert(
        'Privacy Notice',
        'Using phone or email will share your contact information with other users. In-app messaging is recommended for better privacy protection.',
        [{text: 'OK', style: 'default'}]
      );
    }
  };

  const handleInputChange = (field: string, value: string) => {
    const newData = {
      ...data,
      [field]: value,
    };
    onChange(newData);

    // Clear error for this field when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({...prev, [field]: undefined}));
    }
  };

  const validateStep = (): boolean => {
    const newErrors: typeof errors = {};

    if (!data.contactPreference) {
      newErrors.contactPreference = 'Please select a contact preference';
    }

    if (itemType === 'found' && !data.holdingLocation?.trim()) {
      newErrors.holdingLocation = 'Please specify where you are keeping the item';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    (global as any).validateStep4 = validateStep;
    return () => {
      delete (global as any).validateStep4;
    };
  }, [data, errors]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>
          How can people contact you?
        </Text>

        <Text style={styles.description}>
          Choose how others can reach you about this item. We recommend in-app messaging for better privacy protection.
        </Text>

        <View style={styles.contactOptions}>
          {contactOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.contactOption,
                data.contactPreference === option.value && styles.selectedOption,
              ]}
              onPress={() => handleContactPreferenceSelect(option.value)}>
              <View style={styles.optionHeader}>
                <View style={styles.optionIcon}>
                  <Text style={styles.optionIconText}>
                    {option.icon === 'message' && '💬'}
                    {option.icon === 'phone' && '📞'}
                    {option.icon === 'email' && '📧'}
                  </Text>
                </View>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
                {option.recommended && (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>Recommended</Text>
                  </View>
                )}
              </View>
              {data.contactPreference === option.value && (
                <View style={styles.checkIndicator}>
                  <Text style={styles.checkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {errors.contactPreference && (
          <Text style={styles.errorText}>{errors.contactPreference}</Text>
        )}

        {itemType === 'found' && (
          <>
            <Text style={styles.sectionTitle}>
              Where are you keeping the item?
            </Text>

            <Input
              label="Holding Location"
              placeholder="e.g., At my home, At the front desk, In my car"
              value={data.holdingLocation || ''}
              onChangeText={(value) => handleInputChange('holdingLocation', value)}
              error={errors.holdingLocation}
              multiline
              numberOfLines={2}
              maxLength={200}
              helperText="This helps the owner know where to pick up the item if it matches"
            />
          </>
        )}

        <Card margin="sm" padding="md" shadow={false}>
          <Text style={styles.privacyTitle}>🔒 Privacy & Safety</Text>
          <Text style={styles.privacyText}>
            • Your contact information is only shared when you have a confirmed match
          </Text>
          <Text style={styles.privacyText}>
            • You can block or report users who behave inappropriately
          </Text>
          <Text style={styles.privacyText}>
            • Meet in safe public places when exchanging items
          </Text>
          <Text style={styles.privacyText}>
            • Trust your instincts and prioritize your safety
          </Text>
        </Card>

        <Card margin="sm" padding="md" shadow={false}>
          <Text style={styles.tipsTitle}>💡 Tips for Safe Exchange</Text>
          <Text style={styles.tip}>• Meet during daytime in public places</Text>
          <Text style={styles.tip}>• Bring a friend if possible</Text>
          <Text style={styles.tip}>• Verify the item ownership details</Text>
          <Text style={styles.tip}>• Document the condition of the item</Text>
          <Text style={styles.tip}>• Use in-app messaging for all communication</Text>
        </Card>
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
  contactOptions: {
    marginBottom: Spacing.lg,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  selectedOption: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  optionHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  optionIconText: {
    fontSize: 20,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    ...Typography.body,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  optionDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  recommendedBadge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Spacing.borderRadius.sm,
    marginLeft: Spacing.sm,
  },
  recommendedText: {
    ...Typography.caption,
    color: Colors.background,
    fontSize: 10,
    fontWeight: 'bold',
  },
  checkIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  checkText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginBottom: Spacing.md,
  },
  privacyTitle: {
    ...Typography.subtitle,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  privacyText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
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
    marginBottom: Spacing.xs,
  },
});

export default ContactStep;