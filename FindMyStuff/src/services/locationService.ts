import Geolocation from 'react-native-geolocation-service';
import {PermissionsAndroid, Platform, Alert} from 'react-native';

export interface Location {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp?: number;
}

export interface Address {
  address: string;
  city: string;
  state: string;
  country?: string;
  postalCode?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

class LocationService {
  private watchId: number | null = null;

  /**
   * Request location permissions
   */
  async requestLocationPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // iOS permissions are handled automatically
        return true;
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  /**
   * Get current location
   */
  async getCurrentLocation(options: {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
  } = {}): Promise<Location | null> {
    const {
      enableHighAccuracy = true,
      timeout = 15000,
      maximumAge = 10000,
    } = options;

    const hasPermission = await this.requestLocationPermission();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude,
            accuracy: position.coords.accuracy,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp,
          };
          resolve(location);
        },
        (error) => {
          console.error('Location error:', error);
          let errorMessage = 'Unable to get location';

          switch (error.code) {
            case 1:
              errorMessage = 'Location permission denied';
              break;
            case 2:
              errorMessage = 'Location unavailable';
              break;
            case 3:
              errorMessage = 'Location request timed out';
              break;
            default:
              errorMessage = error.message || errorMessage;
          }

          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        }
      );
    });
  }

  /**
   * Start watching location changes
   */
  async startWatchingLocation(
    callback: (location: Location) => void,
    options: {
      enableHighAccuracy?: boolean;
      distanceFilter?: number;
      interval?: number;
      fastestInterval?: number;
    } = {}
  ): Promise<void> {
    const {
      enableHighAccuracy = true,
      distanceFilter = 10, // 10 meters
      interval = 5000, // 5 seconds
      fastestInterval = 2000, // 2 seconds
    } = options;

    const hasPermission = await this.requestLocationPermission();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    if (this.watchId !== null) {
      this.stopWatchingLocation();
    }

    this.watchId = Geolocation.watchPosition(
      (position) => {
        const location: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude,
          accuracy: position.coords.accuracy,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
        };
        callback(location);
      },
      (error) => {
        console.error('Location watching error:', error);
      },
      {
        enableHighAccuracy,
        distanceFilter,
        interval,
        fastestInterval,
      }
    );
  }

  /**
   * Stop watching location changes
   */
  stopWatchingLocation(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Calculate distance between two points in miles
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculate distance in kilometers
   */
  calculateDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    return this.calculateDistance(lat1, lon1, lat2, lon2) * 1.60934;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Convert miles to kilometers
   */
  milesToKilometers(miles: number): number {
    return miles * 1.60934;
  }

  /**
   * Convert kilometers to miles
   */
  kilometersToMiles(km: number): number {
    return km / 1.60934;
  }

  /**
   * Format distance for display
   */
  formatDistance(miles: number): string {
    if (miles < 0.1) {
      return `${Math.round(miles * 5280)} ft`; // Convert to feet
    } else if (miles < 1) {
      return `${miles.toFixed(1)} mi`;
    } else {
      return `${miles.toFixed(0)} mi`;
    }
  }

  /**
   * Check if location is within radius
   */
  isLocationWithinRadius(
    centerLat: number,
    centerLon: number,
    pointLat: number,
    pointLon: number,
    radiusMiles: number
  ): boolean {
    const distance = this.calculateDistance(
      centerLat,
      centerLon,
      pointLat,
      pointLon
    );
    return distance <= radiusMiles;
  }

  /**
   * Get bounding box for location and radius
   */
  getBoundingBox(
    latitude: number,
    longitude: number,
    radiusMiles: number
  ): {
    north: number;
    south: number;
    east: number;
    west: number;
  } {
    const latitudeDelta = radiusMiles / 69; // Approximate miles per degree latitude
    const longitudeDelta =
      radiusMiles /
      Math.cos(this.toRadians(latitude)) /
      69; // Approximate miles per degree longitude

    return {
      north: latitude + latitudeDelta,
      south: latitude - latitudeDelta,
      east: longitude + longitudeDelta,
      west: longitude - longitudeDelta,
    };
  }

  /**
   * Get initial region for map
   */
  getInitialRegion(
    latitude: number,
    longitude: number,
    latitudeDelta: number = 0.01,
    longitudeDelta: number = 0.01
  ) {
    return {
      latitude,
      longitude,
      latitudeDelta,
      longitudeDelta,
    };
  }

  /**
   * Show location error dialog
   */
  showLocationErrorDialog(error: string): void {
    Alert.alert(
      'Location Error',
      `${error}\n\nPlease check your location settings and try again.`,
      [{text: 'OK', style: 'default'}]
    );
  }

  /**
   * Check if location services are enabled
   */
  async isLocationEnabled(): Promise<boolean> {
    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        () => resolve(true),
        () => resolve(false),
        {enableHighAccuracy: false, timeout: 1000}
      );
    });
  }

  /**
   * Open location settings (Android only)
   */
  openLocationSettings(): void {
    if (Platform.OS === 'android') {
      import('react-native').then(({Linking}) => {
        Linking.openSettings().catch((err) =>
          console.error('Error opening settings:', err)
        );
      });
    }
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.stopWatchingLocation();
  }
}

export default new LocationService();