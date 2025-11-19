import React, {useState, useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import Input from './Input';
import Button from './Button';
import {ItemCategory, ReportItemData} from '../types/items';
import Colors from '../constants/colors';
import Typography from '../constants/typography';
import Spacing from '../constants/spacing';

interface ItemDetailsStepProps {
  data: Partial<ReportItemData>;
  onChange: (data: Partial<ReportItemData>) => void;
  itemType: 'lost' | 'found';
}

const categories: {value: ItemCategory; label: string; icon: string}[] = [
  {value: 'electronics', label: 'Electronics', icon: '💻'},
  {value: 'jewelry', label: 'Jewelry', icon: '💎'},
  {value: 'documents', label: 'Documents', icon: '📄'},
  {value: 'clothing', label: 'Clothing', icon: '👔'},
  {value: 'accessories', label: 'Accessories', icon: '👜'},
  {value: 'pets', label: 'Pets', icon: '🐕'},
  {value: 'other', label: 'Other', icon: '📦'},
];

const subcategories: Record<ItemCategory, string[]> = {
  electronics: ['Phone', 'Laptop', 'Tablet', 'Headphones', 'Camera', 'Watch', 'Other'],
  jewelry: ['Ring', 'Necklace', 'Bracelet', 'Earrings', 'Watch', 'Other'],
  documents: ['ID Card', 'Passport', 'Wallet', 'Credit Card', 'Birth Certificate', 'Other'],
  clothing: ['Shirt', 'Pants', 'Jacket', 'Shoes', 'Dress', 'Coat', 'Other'],
  accessories: ['Bag', 'Backpack', 'Umbrella', 'Glasses', 'Keys', 'Wallet', 'Other'],
  pets: ['Dog', 'Cat', 'Bird', 'Other'],
  other: [],
};

const ItemDetailsStep: React.FC<ItemDetailsStepProps> = ({
  data,
  onChange,
  itemType,
}) => {
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    category?: string;
  }>({});

  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | null>(
    data.category || null
  );

  const handleInputChange = (field: keyof ReportItemData, value: string) => {
    const newData = {...data, [field]: value};
    onChange(newData);

    // Clear error for this field when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({...prev, [field]: undefined}));
    }
  };

  const handleCategorySelect = (category: ItemCategory) => {
    setSelectedCategory(category);
    const newData = {
      ...data,
      category,
      subcategory: undefined, // Reset subcategory when category changes
    };
    onChange(newData);

    if (errors.category) {
      setErrors(prev => ({...prev, category: undefined}));
    }
  };

  const handleSubcategorySelect = (subcategory: string) => {
    const newData = {...data, subcategory};
    onChange(newData);
  };

  const validateStep = (): boolean => {
    const newErrors: typeof errors = {};

    if (!data.title?.trim()) {
      newErrors.title = 'Title is required';
    } else if (data.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (data.title.trim().length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (!data.description?.trim()) {
      newErrors.description = 'Description is required';
    } else if (data.description.trim().length < 10) {
      newErrors.description = 'Please provide more details (min 10 characters)';
    } else if (data.description.trim().length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    if (!selectedCategory) {
      newErrors.category = 'Please select a category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    // Expose validation method to parent
    (global as any).validateStep1 = validateStep;
    return () => {
      delete (global as any).validateStep1;
    };
  }, [data, selectedCategory, errors]);

  return (
    <View style={styles.container}>
      <Input
        label={`What ${itemType === 'lost' ? 'did you lose' : 'did you find'}?`}
        placeholder="e.g., iPhone 13 Pro, Wedding Ring, Black Backpack"
        value={data.title || ''}
        onChangeText={(value) => handleInputChange('title', value)}
        error={errors.title}
        maxLength={100}
      />

      <Input
        label="Description"
        placeholder={`Provide details about the ${itemType === 'lost' ? 'lost' : 'found'} item...`}
        value={data.description || ''}
        onChangeText={(value) => handleInputChange('description', value)}
        error={errors.description}
        multiline
        numberOfLines={4}
        maxLength={1000}
        inputStyle={styles.descriptionInput}
      />

      <Text style={styles.sectionTitle}>Category</Text>
      <View style={styles.categoryGrid}>
        {categories.map((category) => (
          <Button
            key={category.value}
            title={`${category.icon} ${category.label}`}
            onPress={() => handleCategorySelect(category.value)}
            variant={
              selectedCategory === category.value ? 'primary' : 'outline'
            }
            size="small"
            style={styles.categoryButton}
          />
        ))}
      </View>

      {errors.category && (
        <Text style={styles.errorText}>{errors.category}</Text>
      )}

      {selectedCategory && subcategories[selectedCategory].length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Subcategory</Text>
          <View style={styles.subcategoryGrid}>
            {subcategories[selectedCategory].map((subcategory) => (
              <Button
                key={subcategory}
                title={subcategory}
                onPress={() => handleSubcategorySelect(subcategory)}
                variant={
                  data.subcategory === subcategory ? 'secondary' : 'ghost'
                }
                size="small"
                style={styles.subcategoryButton}
              />
            ))}
          </View>
        </>
      )}

      {itemType === 'lost' && (
        <Input
          label="Reward (optional)"
          placeholder="Amount in USD"
          value={data.reward ? data.reward.toString() : ''}
          onChangeText={(value) => {
            const numValue = parseFloat(value) || undefined;
            handleInputChange('reward', numValue);
          }}
          keyboardType="numeric"
          helperText="Optional: Add a reward to encourage return of your item"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    ...Typography.subtitle,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  categoryButton: {
    margin: Spacing.xs,
    minWidth: 100,
  },
  subcategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  subcategoryButton: {
    margin: Spacing.xs,
    minWidth: 80,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
});

export default ItemDetailsStep;