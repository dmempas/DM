import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { itemsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ItemCard = ({ item, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={() => onPress(item)}>
    <View style={styles.cardHeader}>
      <View style={[styles.itemTypeBadge, { backgroundColor: item.item_type === 'lost' ? '#ff6b6b' : '#51cf66' }]}>
        <Text style={styles.itemTypeText}>{item.item_type === 'lost' ? 'LOST' : 'FOUND'}</Text>
      </View>
      <Text style={styles.categoryText}>{item.category.replace('_', ' ').toUpperCase()}</Text>
    </View>

    <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
    <Text style={styles.itemDescription} numberOfLines={3}>{item.description}</Text>

    {item.last_location && (
      <View style={styles.locationRow}>
        <Icon name="location-on" size={16} color="#666" />
        <Text style={styles.locationText} numberOfLines={1}>{item.last_location}</Text>
      </View>
    )}

    <View style={styles.cardFooter}>
      <Text style={styles.dateText}>
        {new Date(item.date_time_lost_found).toLocaleDateString()}
      </Text>
      <Text style={styles.reporterText}>by {item.reporter_name}</Text>
    </View>

    {item.photos && item.photos.length > 0 && (
      <View style={styles.photoIndicator}>
        <Icon name="photo-camera" size={14} color="#666" />
        <Text style={styles.photoCount}>{item.photos.length}</Text>
      </View>
    )}
  </TouchableOpacity>
);

const HomeScreen = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const navigation = useNavigation();
  const { user } = useAuth();

  const categories = [
    { key: 'all', label: 'All', icon: 'apps' },
    { key: 'gadgets', label: 'Gadgets', icon: 'devices' },
    { key: 'school_supplies', label: 'School', icon: 'book' },
    { key: 'ids', label: 'IDs', icon: 'credit-card' },
    { key: 'wallets', label: 'Wallets', icon: 'account-balance-wallet' },
    { key: 'clothes', label: 'Clothes', icon: 'checkroom' },
    { key: 'other', label: 'Other', icon: 'more-horiz' },
  ];

  const typeFilters = [
    { key: 'all', label: 'All' },
    { key: 'lost', label: 'Lost' },
    { key: 'found', label: 'Found' },
  ];

  const fetchItems = async (reset = false) => {
    try {
      if (reset) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const params = {};
      if (selectedFilter !== 'all') {
        params.category = selectedFilter;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await itemsAPI.getItems(params);
      setItems(response.data.data.items);
    } catch (error) {
      console.error('Fetch items error:', error);
      Alert.alert('Error', 'Failed to load items');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [selectedFilter, searchQuery]);

  const handleItemPress = (item) => {
    navigation.navigate('ItemDetails', { itemId: item.id });
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const renderCategoryFilter = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterContainer}
      contentContainerStyle={styles.filterContent}
    >
      {categories.map((category) => (
        <TouchableOpacity
          key={category.key}
          style={[
            styles.filterChip,
            selectedFilter === category.key && styles.filterChipActive,
          ]}
          onPress={() => setSelectedFilter(category.key)}
        >
          <Icon
            name={category.icon}
            size={16}
            color={selectedFilter === category.key ? '#fff' : '#666'}
          />
          <Text
            style={[
              styles.filterChipText,
              selectedFilter === category.key && styles.filterChipTextActive,
            ]}
          >
            {category.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderItem = ({ item }) => (
    <ItemCard item={item} onPress={handleItemPress} />
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="clear" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter */}
      {renderCategoryFilter()}

      {/* Items List */}
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.itemsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchItems(true)} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="search-off" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No items found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your search or filters
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      }

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <Text>Loading items...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterContent: {
    paddingRight: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  filterChipActive: {
    backgroundColor: '#2196F3',
  },
  filterChipText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  filterChipTextActive: {
    color: 'white',
  },
  itemsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
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
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  reporterText: {
    fontSize: 12,
    color: '#999',
  },
  photoIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  photoCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen;