import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { itemsAPI } from '../services/api';

const MapScreen = () => {
  const mapRef = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    itemType: 'all', // 'all', 'lost', 'found'
    category: 'all',
  });
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const categories = [
    { key: 'all', label: 'All' },
    { key: 'gadgets', label: 'Gadgets' },
    { key: 'school_supplies', label: 'School' },
    { key: 'ids', label: 'IDs' },
    { key: 'wallets', label: 'Wallets' },
    { key: 'clothes', label: 'Clothes' },
    { key: 'other', label: 'Other' },
  ];

  useEffect(() => {
    loadMapItems();
  }, [filters]);

  const loadMapItems = async () => {
    try {
      setLoading(true);

      const params = {};
      if (filters.itemType !== 'all') {
        params.item_type = filters.itemType;
      }
      if (filters.category !== 'all') {
        params.category = filters.category;
      }

      const response = await itemsAPI.getItems(params);
      const itemsWithLocation = response.data.data.items.filter(
        item => item.latitude && item.longitude
      );

      setItems(itemsWithLocation);

      // Adjust map to show all items if available
      if (itemsWithLocation.length > 0) {
        fitMapToItems(itemsWithLocation);
      }
    } catch (error) {
      console.error('Load map items error:', error);
      Alert.alert('Error', 'Failed to load map items');
    } finally {
      setLoading(false);
    }
  };

  const fitMapToItems = (itemsToShow) => {
    if (itemsToShow.length === 0) return;

    const latitudes = itemsToShow.map(item => parseFloat(item.latitude));
    const longitudes = itemsToShow.map(item => parseFloat(item.longitude));

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLon = Math.min(...longitudes);
    const maxLon = Math.max(...longitudes);

    const midLat = (minLat + maxLat) / 2;
    const midLon = (minLon + maxLon) / 2;

    const latDelta = (maxLat - minLat) * 1.5;
    const lonDelta = (maxLon - minLon) * 1.5;

    setMapRegion({
      latitude: midLat,
      longitude: midLon,
      latitudeDelta: Math.max(latDelta, 0.02),
      longitudeDelta: Math.max(lonDelta, 0.02),
    });
  };

  const handleMarkerPress = (item) => {
    Alert.alert(
      item.title,
      `${item.item_type.toUpperCase()} - ${item.category.replace('_', ' ')}\n\n${item.description.substring(0, 100)}${item.description.length > 100 ? '...' : ''}\n\n${item.last_location || 'No location specified'}`,
      [
        { text: 'View Details', onPress: () => navigation.navigate('ItemDetails', { itemId: item.id }) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to show your current location');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});

      setMapRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    } catch (error) {
      console.error('Get current location error:', error);
      Alert.alert('Error', 'Unable to get your current location');
    }
  };

  const getMarkerColor = (itemType) => {
    return itemType === 'lost' ? '#ff6b6b' : '#51cf66';
  };

  const renderFilterButton = (label, value, options, activeFilter, onFilterChange) => (
    <View style={styles.filterSection}>
      <Text style={styles.filterLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.filterChip,
              activeFilter === option.key && styles.filterChipActive,
            ]}
            onPress={() => onFilterChange(option.key)}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === option.key && styles.filterChipTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filters */}
      <View style={styles.filtersContainer}>
        {renderFilterButton(
          'Type',
          filters.itemType,
          [
            { key: 'all', label: 'All' },
            { key: 'lost', label: 'Lost' },
            { key: 'found', label: 'Found' },
          ],
          filters.itemType,
          (value) => setFilters(prev => ({ ...prev, itemType: value }))
        )}

        {renderFilterButton(
          'Category',
          filters.category,
          categories,
          filters.category,
          (value) => setFilters(prev => ({ ...prev, category: value }))
        )}
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={mapRegion}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
        >
          {/* Item Markers */}
          {items.map((item) => (
            <Marker
              key={item.id}
              coordinate={{
                latitude: parseFloat(item.latitude),
                longitude: parseFloat(item.longitude),
              }}
              pinColor={getMarkerColor(item.item_type)}
              onPress={() => handleMarkerPress(item)}
              title={item.title}
              description={`${item.item_type.toUpperCase()} - ${item.category.replace('_', ' ')}`}
            >
              <View style={[styles.customMarker, { backgroundColor: getMarkerColor(item.item_type) }]}>
                <Icon
                  name={item.item_type === 'lost' ? 'search-off' : 'find-in-page'}
                  size={16}
                  color="white"
                />
              </View>
            </Marker>
          ))}

          {/* Privacy circles around markers (10-meter radius) */}
          {items.map((item) => (
            <Circle
              key={`circle-${item.id}`}
              center={{
                latitude: parseFloat(item.latitude),
                longitude: parseFloat(item.longitude),
              }}
              radius={10}
              strokeColor={getMarkerColor(item.item_type)}
              fillColor={`${getMarkerColor(item.item_type)}20`}
              strokeWidth={1}
            />
          ))}
        </MapView>

        {/* Current Location Button */}
        <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation}>
          <Icon name="my-location" size={24} color="#2196F3" />
        </TouchableOpacity>

        {/* Items Count */}
        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {items.length} {filters.itemType === 'all' ? 'items' : filters.itemType} shown
          </Text>
        </View>
      </View>

      {/* Map Legend */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Legend</Text>
        <View style={styles.legendItem}>
          <View style={[styles.legendMarker, { backgroundColor: '#ff6b6b' }]} />
          <Text style={styles.legendText}>Lost Item</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendMarker, { backgroundColor: '#51cf66' }]} />
          <Text style={styles.legendText}>Found Item</Text>
        </View>
      </View>
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
  filtersContainer: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterSection: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 16,
    marginBottom: 8,
  },
  filterChip: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  filterChipActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  filterChipTextActive: {
    color: 'white',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  customMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  locationButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  countContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  countText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  legendContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  legendMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#666',
  },
});

export default MapScreen;