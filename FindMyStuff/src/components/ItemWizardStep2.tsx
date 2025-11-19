import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import MapView, {Marker, Region} from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import Input from './Input';
import Button from './Button';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {ReportItemData} from '../types/items';
import Colors from '../constants/colors';
import Typography from '../constants/typography';
import Spacing from '../constants/spacing';

interface LocationStepProps {
  data: Partial<ReportItemData>;
  onChange: (data: Partial<ReportItemData>) => void;
  itemType: 'lost' | 'found';
}

const LocationStep: React.FC<LocationStepProps> = ({
  data,
  onChange,
  itemType,
}) => {
  const [region, setRegion] = useState<Region>({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [marker, setMarker] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    address?: string;
    location?: string;
  }>({});
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    requestLocationPermission();
    if (data.location) {
      const coords = data.location.coordinates;
      setMarker({
        latitude: coords[1],
        longitude: coords[0],
      });
      setRegion({
        latitude: coords[1],
        longitude: coords[0],
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
        }
      } catch (err) {
        console.warn('Location permission denied');
      }
    } else {
      getCurrentLocation();
    }
  };

  const getCurrentLocation = () => {
    setLoading(true);
    Geolocation.getCurrentPosition(
      (position) => {
        const {latitude, longitude} = position.coords;
        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(newRegion);
        setMarker({latitude, longitude});
        setLoading(false);

        // Update data with new location
        const locationData = {
          ...data.location,
          coordinates: [longitude, latitude],
        };
        handleLocationChange(locationData, 'Current Location');
      },
      (error) => {
        setLoading(false);
        console.warn('Location error:', error);
        Alert.alert(
          'Location Error',
          'Unable to get your current location. Please select location manually.'
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  };

  const handleMapPress = (event: any) => {
    const {coordinate} = event.nativeEvent;
    setMarker(coordinate);

    // Update data with new coordinates
    const locationData = {
      ...data.location,
      coordinates: [coordinate.longitude, coordinate.latitude],
    };
    handleLocationChange(locationData, data.location?.description || 'Selected on map');
  };

  const handleLocationChange = (locationData: any, description: string) => {
    const newData = {
      ...data,
      location: {
        ...locationData,
        type: 'Point' as const,
        description,
        address: locationData.address || description,
        city: locationData.city || '',
        state: locationData.state || '',
      },
    };
    onChange(newData);
  };

  const handleInputChange = (field: string, value: string) => {
    const newData = {
      ...data,
      location: {
        ...data.location,
        [field]: value,
      },
    };
    onChange(newData);

    // Clear error for this field when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({...prev, [field]: undefined}));
    }
  };

  const validateStep = (): boolean => {
    const newErrors: typeof errors = {};

    if (!marker) {
      newErrors.location = 'Please select a location on the map';
    }

    if (!data.location?.address?.trim()) {
      newErrors.address = 'Address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    (global as any).validateStep2 = validateStep;
    return () => {
      delete (global as any).validateStep2;
    };
  }, [marker, data.location, errors]);

  const centerMapOnMarker = () => {
    if (marker && mapRef.current) {
      mapRef.current.animateToRegion({
        ...region,
        latitude: marker.latitude,
        longitude: marker.longitude,
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        Where was the item {itemType === 'lost' ? 'lost' : 'found'}?
      </Text>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          onPress={handleMapPress}
          onRegionChangeComplete={setRegion}>
          {marker && (
            <Marker
              coordinate={marker}
              title={itemType === 'lost' ? 'Lost Item Location' : 'Found Item Location'}
              description={data.location?.description}
              pinColor={itemType === 'lost' ? Colors.error : Colors.secondary}
            />
          )}
        </MapView>

        <View style={styles.mapControls}>
          <Button
            title="Use Current Location"
            onPress={getCurrentLocation}
            loading={loading}
            variant="outline"
            size="small"
            icon={<Icon name="my-location" size={16} color={Colors.primary} />}
          />

          {marker && (
            <Button
              title="Center"
              onPress={centerMapOnMarker}
              variant="ghost"
              size="small"
              icon={<Icon name="center-focus-strong" size={16} color={Colors.primary} />}
            />
          )}
        </View>
      </View>

      <Input
        label="Location Description"
        placeholder={`e.g., ${itemType === 'lost' ? 'Left on coffee shop table' : 'Found near bus stop'}`}
        value={data.location?.description || ''}
        onChangeText={(value) => handleInputChange('description', value)}
        error={errors.location || errors.address}
        maxLength={200}
      />

      <Input
        label="Street Address"
        placeholder="Enter the street address"
        value={data.location?.address || ''}
        onChangeText={(value) => handleInputChange('address', value)}
        error={errors.address}
        maxLength={200}
      />

      <View style={styles.addressRow}>
        <Input
          label="City"
          placeholder="City"
          value={data.location?.city || ''}
          onChangeText={(value) => handleInputChange('city', value)}
          containerStyle={styles.addressHalf}
        />

        <Input
          label="State"
          placeholder="State"
          value={data.location?.state || ''}
          onChangeText={(value) => handleInputChange('state', value)}
          containerStyle={styles.addressHalf}
        />
      </View>

      {errors.location && (
        <Text style={styles.errorText}>{errors.location}</Text>
      )}

      <Text style={styles.helperText}>
        Tap on the map to select the exact location. The more precise the location, the better we can match you with potential finds/reports.
      </Text>
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
  },
  mapContainer: {
    height: 250,
    marginBottom: Spacing.md,
    borderRadius: Spacing.borderRadius.lg,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'column',
    gap: Spacing.xs,
  },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addressHalf: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  helperText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    lineHeight: 18,
  },
});

export default LocationStep;