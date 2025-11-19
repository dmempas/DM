export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  phoneNumber: string | null;
  isVerified: boolean;
  averageRating: number; // 0-5
  totalRatings: number;
  createdAt: Date;
  lastActiveAt: Date;
  location: {
    latitude: number;
    longitude: number;
  } | null;
  preferences: {
    maxDistance: number; // in miles
    notifications: {
      newMatches: boolean;
      messages: boolean;
      itemUpdates: boolean;
    };
  };
  fcmToken: string | null;
}

export interface AuthError {
  code: string;
  message: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  displayName: string;
  confirmPassword: string;
}