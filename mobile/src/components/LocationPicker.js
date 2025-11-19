import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal as RNModal,
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Location from 'expo-location';

const LocationPicker = ({ onLocationSelect, onClose, initialLocation }) => {
  const [location, setLocation] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    address: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });

  useEffect(() => {
    // Set initial location if provided
    if (initialLocation?.latitude && initialLocation?.longitude) {
      const coords = {
        latitude: parseFloat(initialLocation.latitude),
        longitude: parseFloat(initialLocation.longitude),
        address: initialLocation.address || '',
      };
      setLocation(coords);
      setMapRegion({
        ...mapRegion,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    } else {
      getCurrentLocation();
    }
  }, []);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for this feature');
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        address: 'Current Location',
      };

      setLocation(coords);
      setMapRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    } catch (error) {
      console.error('Get current location error:', error);
      Alert.alert('Error', 'Unable to get your current location');
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = (e) => {
    const coords = e.nativeEvent.coordinate;
    setLocation(prev => ({
      ...prev,
      latitude: coords.latitude,
      longitude: coords.longitude,
    }));
    reverseGeocode(coords.latitude, coords.longitude);
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      setLoading(true);
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });

      if (results && results.length > 0) {
        const address = [
          results[0].name,
          results[0].street,
          results[0].city,
          results[0].region,
        ].filter(Boolean).join(', ');

        setLocation(prev => ({ ...prev, address }));
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const results = await Location.geocodeAsync(searchQuery);

      if (results && results.length > 0) {
        const coords = {
          latitude: results[0].latitude,
          longitude: results[0].longitude,
          address: searchQuery,
        };

        setLocation(coords);
        setMapRegion({
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
      } else {
        Alert.alert('Not Found', 'Location not found. Please try a different search.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      Alert.alert('Error', 'Failed to search for location');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    onLocationSelect(location);
  };

  // Common campus locations (you can customize these for your school)
  const commonLocations = [
    { name: 'Library', latitude: 37.78825, longitude: -122.4324 },
    { name: 'Student Center', latitude: 37.78925, longitude: -122.4334 },
    { name: 'Main Building', latitude: 37.78725, longitude: -122.4314 },
    { name: 'Cafeteria', latitude: 37.78825, longitude: -122.4344 },
    { name: 'Gym', latitude: 37.79025, longitude: -122.4324 },
  ];

  const handleCommonLocationSelect = (place) => {
    setLocation({
      latitude: place.latitude,
      longitude: place.longitude,
      address: place.name,
    });
    setMapRegion({
      latitude: place.latitude,
      longitude: place.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Select Location</Text>
        <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
          <Text style={styles.confirmButtonText}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search for a location..."
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
          <Icon name="search" size={20} color="#2196F3" />
        </TouchableOpacity>
      </View>

      {/* Current Location Button */}
      <TouchableOpacity style={styles.currentLocationButton} onPress={getCurrentLocation}>
        <Icon name="my-location" size={20} color="#2196F3" />
        <Text style={styles.currentLocationText}>Use Current Location</Text>
      </TouchableOpacity>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={mapRegion}
          onPress={handleMapPress}
          showsUserLocation
          showsMyLocationButton={false}
        >
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            pinColor="#2196F3"
          />
          <Circle
            center={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            radius={50}
            strokeColor="#2196F3"
            fillColor="rgba(33, 150, 243, 0.2)"
            strokeWidth={2}
          />
        </MapView>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#2196F3" />
          </View>
        )}
      </View>

      {/* Selected Location Display */}
      <View style={styles.locationDisplay}>
        <Icon name="location-on" size={20} color="#2196F3" />
        <Text style={styles.locationText}>
          {location.address || 'Tap on the map to select location'}
        </Text>
      </View>

      {/* Common Locations */}
      <View style={styles.commonLocationsContainer}>
        <Text style={styles.commonLocationsTitle}>Common Campus Locations</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {commonLocations.map((place, index) => (
            <TouchableOpacity
              key={index}
              style={styles.commonLocationButton}
              onPress={() => handleCommonLocationSelect(place)}
            >
              <Text style={styles.commonLocationText}>{place.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  confirmButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  confirmButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 8,
  },
  searchButton: {
    padding: 12,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 8,
  },
  currentLocationText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#2196F3',
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 8,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  commonLocationsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  commonLocationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  commonLocationButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  commonLocationText: {
    color: 'white',
    fontSize: 14,
  },
});

export default LocationPicker;