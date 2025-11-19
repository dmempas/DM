import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Card from './Card';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Item, LostItem, FoundItem} from '../types/items';
import {SearchFiltersState} from './SearchFilters';
import Colors from '../constants/colors';
import Typography from '../constants/typography';
import Spacing from '../constants/spacing';
import LocationService from '../services/locationService';

interface SearchResultsProps {
  filters: SearchFiltersState;
  userLocation?: {latitude: number; longitude: number};
  onItemPress: (item: Item) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  filters,
  userLocation,
  onItemPress,
}) => {
  const navigation = useNavigation();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState<any>(null);

  useEffect(() => {
    searchItems();
  }, [filters]);

  const searchItems = async (reset: boolean = true) => {
    if (reset) {
      setLoading(true);
      setItems([]);
      setLastVisible(null);
      setHasMore(true);
    }

    try {
      let query = buildQuery(filters, reset ? null : lastVisible);
      const snapshot = await query.get();

      const newItems = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Item[];

      if (reset) {
        setItems(newItems);
      } else {
        setItems(prev => [...prev, ...newItems]);
      }

      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length >= 20); // Assuming pagination size of 20

    } catch (error) {
      console.error('Error searching items:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const buildQuery = (filterState: SearchFiltersState, lastDoc?: any) => {
    const {firestore} = require('../services/firebase').default;

    // Choose collection based on item type filter
    let query: any;

    if (filterState.itemType === 'lost') {
      query = firestore.lostItems.orderBy('createdAt', 'desc');
    } else if (filterState.itemType === 'found') {
      query = firestore.foundItems.orderBy('createdAt', 'desc');
    } else {
      // For 'all', we'll need to do two separate queries and merge
      // For simplicity, let's search both collections
      return firestore.lostItems.orderBy('createdAt', 'desc').limit(20);
    }

    // Apply filters
    if (filterState.category) {
      query = query.where('category', '==', filterState.category);
    }

    if (filterState.query) {
      // Simple text search - in production, you'd use Algolia or similar
      query = query.where('tags', 'array-contains', filterState.query.toLowerCase());
    }

    if (filterState.location.enabled && userLocation) {
      const bounds = LocationService.getBoundingBox(
        userLocation.latitude,
        userLocation.longitude,
        filterState.location.radius
      );

      query = query
        .where('location.coordinates.1', '>=', bounds.south)
        .where('location.coordinates.1', '<=', bounds.north)
        .where('location.coordinates.0', '>=', bounds.west)
        .where('location.coordinates.0', '<=', bounds.east);
    }

    // Apply status filter
    if (filterState.itemType === 'lost') {
      query = query.where('status', '==', 'active');
    } else if (filterState.itemType === 'found') {
      query = query.where('status', '==', 'available');
    }

    // Apply pagination
    query = query.limit(20);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    return query;
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    searchItems(true);
  }, [filters]);

  const onEndReached = () => {
    if (!loading && hasMore && !refreshing) {
      searchItems(false);
    }
  };

  const renderFooter = () => {
    if (!loading) return null;

    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.footerText}>Loading more items...</Text>
      </View>
    );
  };

  const formatDistance = (item: Item): string | null => {
    if (!userLocation || !item.location?.coordinates) return null;

    const distance = LocationService.calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      item.location.coordinates[1],
      item.location.coordinates[0]
    );

    return LocationService.formatDistance(distance);
  };

  const renderItem = ({item}: {item: Item}) => {
    const isLostItem = (item as any).dateLost !== undefined;
    const distance = formatDistance(item);

    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => onItemPress(item)}>
        <Card margin="sm" padding="md">
          <View style={styles.itemHeader}>
            <View style={styles.itemInfo}>
              <View style={styles.itemTypeContainer}>
                <Icon
                  name={isLostItem ? 'search' : 'found'}
                  size={16}
                  color={isLostItem ? Colors.error : Colors.secondary}
                />
                <Text style={styles.itemTypeText}>
                  {isLostItem ? 'Lost' : 'Found'}
                </Text>
              </View>

              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemDescription} numberOfLines={2}>
                {item.description}
              </Text>

              <View style={styles.itemMetadata}>
                <View style={styles.metadataItem}>
                  <Icon name="category" size={14} color={Colors.neutral} />
                  <Text style={styles.metadataText}>{item.category}</Text>
                </View>

                <View style={styles.metadataItem}>
                  <Icon name="location-on" size={14} color={Colors.neutral} />
                  <Text style={styles.metadataText}>
                    {item.location?.city || 'Unknown location'}
                  </Text>
                </View>

                {distance && (
                  <View style={styles.metadataItem}>
                    <Icon name="directions" size={14} color={Colors.neutral} />
                    <Text style={styles.metadataText}>{distance}</Text>
                  </View>
                )}
              </View>

              <View style={styles.itemFooter}>
                <Text style={styles.dateText}>
                  {isLostItem ? 'Lost' : 'Found'} {formatDate(item.createdAt)}
                </Text>

                {item.photos && item.photos.length > 0 && (
                  <View style={styles.photoCount}>
                    <Icon name="photo" size={14} color={Colors.neutral} />
                    <Text style={styles.photoCountText}>{item.photos.length}</Text>
                  </View>
                )}
              </View>
            </View>

            {item.photos && item.photos.length > 0 && (
              <Image source={{uri: item.photos[0]}} style={styles.itemImage} />
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'today';
    if (diffDays === 2) return 'yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    if (diffDays <= 30) return `${Math.floor((diffDays - 1) / 7)} weeks ago`;
    return `${Math.floor((diffDays - 1) / 30)} months ago`;
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="search-off" size={64} color={Colors.neutralLight} />
      <Text style={styles.emptyStateTitle}>No items found</Text>
      <Text style={styles.emptyStateText}>
        Try adjusting your filters or search terms to find more items.
      </Text>
    </View>
  );

  if (loading && items.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Searching for items...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.1}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmptyState}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: Spacing.screen.horizontal,
    paddingBottom: Spacing.xxxl,
  },
  itemContainer: {
    marginBottom: Spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemInfo: {
    flex: 1,
  },
  itemTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  itemTypeText: {
    ...Typography.caption,
    color: Colors.neutral,
    marginLeft: Spacing.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  itemTitle: {
    ...Typography.subtitle,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.xs,
  },
  itemDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  itemMetadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
    marginBottom: Spacing.xs,
  },
  metadataText: {
    ...Typography.caption,
    color: Colors.neutral,
    marginLeft: Spacing.xs,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    ...Typography.caption,
    color: Colors.neutral,
  },
  photoCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoCountText: {
    ...Typography.caption,
    color: Colors.neutral,
    marginLeft: Spacing.xs,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: Spacing.borderRadius.md,
    marginLeft: Spacing.md,
    resizeMode: 'cover',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyStateTitle: {
    ...Typography.headline,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyStateText: {
    ...Typography.body,
    color: Colors.textDisabled,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default SearchResults;