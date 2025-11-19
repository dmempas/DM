import { ImageSourcePropType } from 'react-native';

export const AppConstants = {
  // App information
  appName: 'FindMyStuff',
  version: '1.0.0',

  // Item categories (enum from database schema)
  itemCategories: [
    'electronics',
    'jewelry',
    'documents',
    'clothing',
    'accessories',
    'pets',
    'other'
  ] as const,

  // Item statuses
  itemStatuses: {
    lost: ['active', 'resolved', 'expired'] as const,
    found: ['available', 'claimed', 'expired'] as const,
  },

  // Match statuses
  matchStatuses: ['pending', 'confirmed', 'rejected', 'expired'] as const,

  // Contact preferences
  contactPreferences: ['inApp', 'phone', 'email'] as const,

  // Message types
  messageTypes: ['text', 'image', 'location'] as const,

  // Default settings
  defaults: {
    maxDistance: 25, // miles
    locationRadius: 50, // miles for search
    minMatchScore: 70, // out of 100
    maxPhotos: 5,
    searchRadius: 25, // miles
    paginationSize: 20,
    messageCharLimit: 1000,
    descriptionCharLimit: 1000,
    titleCharLimit: 100,
    reviewCharLimit: 500,
  },

  // API endpoints
  api: {
    baseUrl: 'https://api.findmystuff.app',
    timeout: 10000, // 10 seconds
    retryAttempts: 3,
  },

  // Firebase collections
  collections: {
    users: 'users',
    lostItems: 'lostItems',
    foundItems: 'foundItems',
    matches: 'matches',
    messages: 'messages',
    ratings: 'ratings',
  },

  // Match confidence thresholds
  matchThresholds: {
    high: 85, // 85-100
    medium: 70, // 70-84
    low: 50, // 50-69
  },

  // Rate limiting
  rateLimits: {
    auth: {
      attemptsPerMinute: 5,
      lockoutDuration: 15, // minutes
    },
    items: {
      perHour: 10,
      perDay: 50,
    },
    messages: {
      perHour: 50,
      perDay: 200,
    },
    searches: {
      perHour: 100,
      perDay: 500,
    },
  },

  // Image upload settings
  imageUpload: {
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 0.8,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    acceptedFormats: ['image/jpeg', 'image/png', 'image/webp'],
  },

  // Location settings
  location: {
    timeout: 10000,
    maximumAge: 60000, // 1 minute
    enableHighAccuracy: true,
    distanceFilter: 10, // meters
  },

  // Notification types
  notificationTypes: {
    newMatch: 'new_match',
    message: 'message',
    statusUpdate: 'status_update',
    profile: 'profile',
  },

  // Animation durations
  animations: {
    fast: 200,
    normal: 300,
    slow: 500,
  },

  // Screen names for analytics
  screenNames: {
    home: 'HomeScreen',
    search: 'SearchScreen',
    postItem: 'PostItemScreen',
    messages: 'MessagesScreen',
    profile: 'ProfileScreen',
    itemDetail: 'ItemDetailScreen',
    chat: 'ChatScreen',
    reportItem: 'ReportItemScreen',
    login: 'LoginScreen',
    register: 'RegisterScreen',
  },
};

export default AppConstants;