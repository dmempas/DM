import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Modal,
} from 'react-native';
import Button from './Button';
import Input from './Input';
import Card from './Card';
import {ItemCategory} from '../types/items';
import Colors from '../constants/colors';
import Typography from '../constants/typography';
import Spacing from '../constants/spacing';

interface SearchFiltersProps {
  visible: boolean;
  filters: SearchFiltersState;
  onApply: (filters: SearchFiltersState) => void;
  onClose: () => void;
  onReset: () => void;
}

export interface SearchFiltersState {
  query: string;
  category?: ItemCategory;
  itemType: 'all' | 'lost' | 'found';
  dateRange: {
    startDate?: Date;
    endDate?: Date;
  };
  location: {
    enabled: boolean;
    latitude?: number;
    longitude?: number;
    radius: number; // in miles
  };
  sortBy: 'relevance' | 'date' | 'distance';
  sortOrder: 'asc' | 'desc';
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

const radiusOptions = [
  {value: 1, label: '1 mile'},
  {value: 5, label: '5 miles'},
  {value: 10, label: '10 miles'},
  {value: 25, label: '25 miles'},
  {value: 50, label: '50 miles'},
  {value: 100, label: '100 miles'},
];

const sortOptions = [
  {value: 'relevance', label: 'Relevance'},
  {value: 'date', label: 'Date'},
  {value: 'distance', label: 'Distance'},
];

const SearchFilters: React.FC<SearchFiltersProps> = ({
  visible,
  filters,
  onApply,
  onClose,
  onReset,
}) => {
  const [localFilters, setLocalFilters] = useState<SearchFiltersState>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters, visible]);

  const handleFilterChange = (key: keyof SearchFiltersState, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleNestedFilterChange = (
    parentKey: keyof SearchFiltersState,
    childKey: string,
    value: any
  ) => {
    setLocalFilters(prev => ({
      ...prev,
      [parentKey]: {
        ...(prev[parentKey] as any),
        [childKey]: value,
      },
    }));
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    const defaultFilters: SearchFiltersState = {
      query: '',
      itemType: 'all',
      dateRange: {
        startDate: undefined,
        endDate: undefined,
      },
      location: {
        enabled: false,
        radius: 25,
      },
      sortBy: 'relevance',
      sortOrder: 'desc',
    };
    setLocalFilters(defaultFilters);
    onReset();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Search Filters</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetButton}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Card margin="sm" padding="md">
            <Text style={styles.sectionTitle}>Item Type</Text>
            <View style={styles.itemTypeContainer}>
              {[
                {value: 'all', label: 'All Items'},
                {value: 'lost', label: 'Lost Items'},
                {value: 'found', label: 'Found Items'},
              ].map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.itemTypeButton,
                    localFilters.itemType === type.value && styles.selectedItemType,
                  ]}
                  onPress={() => handleFilterChange('itemType', type.value)}>
                  <Text
                    style={[
                      styles.itemTypeText,
                      localFilters.itemType === type.value && styles.selectedItemTypeText,
                    ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          <Card margin="sm" padding="md">
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.categoryGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.value}
                  style={[
                    styles.categoryButton,
                    localFilters.category === category.value && styles.selectedCategory,
                  ]}
                  onPress={() =>
                    handleFilterChange(
                      'category',
                      localFilters.category === category.value ? undefined : category.value
                    )
                  }>
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text
                    style={[
                      styles.categoryText,
                      localFilters.category === category.value && styles.selectedCategoryText,
                    ]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          <Card margin="sm" padding="md">
            <Text style={styles.sectionTitle}>Search Radius</Text>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>
                Search within {localFilters.location.radius} miles
              </Text>
              <TouchableOpacity
                style={[
                  styles.switch,
                  localFilters.location.enabled && styles.switchEnabled,
                ]}
                onPress={() =>
                  handleNestedFilterChange('location', 'enabled', !localFilters.location.enabled)
                }>
                <View
                  style={[
                    styles.switchThumb,
                    localFilters.location.enabled && styles.switchThumbEnabled,
                  ]}
                />
              </TouchableOpacity>
            </View>

            {localFilters.location.enabled && (
              <View style={styles.radiusContainer}>
                {radiusOptions.map((radius) => (
                  <TouchableOpacity
                    key={radius.value}
                    style={[
                      styles.radiusButton,
                      localFilters.location.radius === radius.value && styles.selectedRadius,
                    ]}
                    onPress={() =>
                      handleNestedFilterChange('location', 'radius', radius.value)
                    }>
                    <Text
                      style={[
                        styles.radiusText,
                        localFilters.location.radius === radius.value && styles.selectedRadiusText,
                      ]}>
                      {radius.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Card>

          <Card margin="sm" padding="md">
            <Text style={styles.sectionTitle}>Sort By</Text>
            <View style={styles.sortContainer}>
              {sortOptions.map((sort) => (
                <TouchableOpacity
                  key={sort.value}
                  style={[
                    styles.sortButton,
                    localFilters.sortBy === sort.value && styles.selectedSort,
                  ]}
                  onPress={() => handleFilterChange('sortBy', sort.value as any)}>
                  <Text
                    style={[
                      styles.sortText,
                      localFilters.sortBy === sort.value && styles.selectedSortText,
                    ]}>
                    {sort.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          <View style={styles.buttonContainer}>
            <Button
              title="Apply Filters"
              onPress={handleApply}
              size="large"
              style={styles.applyButton}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screen.horizontal,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cancelButton: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  resetButton: {
    ...Typography.body,
    color: Colors.primary,
  },
  title: {
    ...Typography.subtitle,
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  content: {
    flex: 1,
    padding: Spacing.screen.horizontal,
  },
  sectionTitle: {
    ...Typography.subtitle,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    fontWeight: Typography.fontWeight.medium,
  },
  itemTypeContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  itemTypeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius.md,
    alignItems: 'center',
  },
  selectedItemType: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  itemTypeText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
  },
  selectedItemTypeText: {
    color: Colors.background,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  categoryButton: {
    width: '30%',
    margin: Spacing.xs,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius.md,
    alignItems: 'center',
  },
  selectedCategory: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  categoryText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: Colors.background,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.neutralLight,
    justifyContent: 'center',
  },
  switchEnabled: {
    backgroundColor: Colors.primary,
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.background,
    alignSelf: 'flex-start',
    marginLeft: 2,
  },
  switchThumbEnabled: {
    alignSelf: 'flex-end',
    marginRight: 2,
  },
  radiusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.md,
    marginHorizontal: -Spacing.xs,
  },
  radiusButton: {
    margin: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius.sm,
  },
  selectedRadius: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  radiusText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  selectedRadiusText: {
    color: Colors.background,
  },
  sortContainer: {
    gap: Spacing.sm,
  },
  sortButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius.md,
  },
  selectedSort: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sortText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  selectedSortText: {
    color: Colors.background,
  },
  buttonContainer: {
    paddingVertical: Spacing.lg,
  },
  applyButton: {
    marginBottom: Spacing.xl,
  },
});

export default SearchFilters;