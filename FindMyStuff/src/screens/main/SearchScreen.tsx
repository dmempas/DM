import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MapView, {Marker} from 'react-native-maps';
import SearchResults from '../../components/SearchResults';
import SearchFilters, {SearchFiltersState} from '../../components/SearchFilters';
import Button from '../../components/Button';
import LocationService from '../../services/locationService';
import {Item} from '../../types/items';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../navigation/AppNavigator';
import Colors from '../../constants/colors';
import Typography from '../../constants/typography';
import Spacing from '../constants/spacing';

type SearchNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

const SearchScreen = () => {
  const navigation = useNavigation<SearchNavigationProp>();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFiltersState>({
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
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [mapRegion, setMapRegion] = useState<any>({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    // Update filters with query
    setFilters(prev => ({...prev, query}));
  }, [query]);

  const getCurrentLocation = async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      if (location) {
        const userCoords = {
          latitude: location.latitude,
          longitude: location.longitude,
        };
        setUserLocation(userCoords);
        setMapRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleSearchSubmit = () => {
    // Trigger search when user submits search
    setFilters(prev => ({...prev, query}));
  };

  const handleFiltersApply = (newFilters: SearchFiltersState) => {
    setFilters(newFilters);
    setQuery(newFilters.query);
  };

  const handleItemPress = (item: Item) => {
    navigation.navigate('ItemDetail', {
      itemId: item.id,
      itemType: (item as any).dateLost ? 'lost' : 'found',
    });
  };

  const toggleMapView = () => {
    setViewMode(prev => prev === 'list' ? 'map' : 'list');
  };

  const centerOnUserLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const renderSearchBar = () => (
    <View style={styles.searchBarContainer}>
      <View style={styles.searchInputContainer}>
        <Icon name="search" size={20} color={Colors.neutral} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for items..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <View style={styles.searchActions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            viewMode === 'list' && styles.activeActionButton,
          ]}
          onPress={toggleMapView}>
          <Icon
            name="view-list"
            size={20}
            color={viewMode === 'list' ? Colors.background : Colors.neutral}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            viewMode === 'map' && styles.activeActionButton,
          ]}
          onPress={toggleMapView}>
          <Icon
            name="map"
            size={20}
            color={viewMode === 'map' ? Colors.background : Colors.neutral}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowFilters(true)}>
          <Icon name="filter-list" size={20} color={Colors.neutral} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMapResults = () => (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={mapRegion}
        onRegionChangeComplete={setMapRegion}
        showsUserLocation
        showsMyLocationButton={false}>
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Your Location"
            pinColor={Colors.primary}
          />
        )}
        {/* Map markers for search results would go here */}
      </MapView>

      <View style={styles.mapControls}>
        <Button
          title="Center"
          onPress={centerOnUserLocation}
          variant="outline"
          size="small"
          icon={<Icon name="my-location" size={16} color={Colors.primary} />}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderSearchBar()}

      {viewMode === 'map' ? (
        renderMapResults()
      ) : (
        <SearchResults
          filters={filters}
          userLocation={userLocation || undefined}
          onItemPress={handleItemPress}
        />
      )}

      <SearchFilters
        visible={showFilters}
        filters={filters}
        onApply={handleFiltersApply}
        onClose={() => setShowFilters(false)}
        onReset={() => {
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
          setFilters(defaultFilters);
          setQuery('');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchBarContainer: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.screen.horizontal,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Spacing.borderRadius.lg,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    height: Spacing.input - 16, // Account for padding
  },
  searchActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeActionButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.screen.horizontal,
    gap: Spacing.xs,
  },
});

export default SearchScreen;