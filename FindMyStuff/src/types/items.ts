import {User} from './auth';

export interface Location {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  address: string;
  city: string;
  state: string;
  description: string;
}

export interface BaseItem {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: ItemCategory;
  subcategory?: string;
  location: Location;
  photos: string[];
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  contactPreference: ContactPreference;
}

export interface LostItem extends BaseItem {
  type: 'lost';
  dateLost: Date;
  isFound: boolean;
  foundBy?: string;
  status: 'active' | 'resolved' | 'expired';
  reward?: number; // in dollars
}

export interface FoundItem extends BaseItem {
  type: 'found';
  dateFound: Date;
  isClaimed: boolean;
  claimedBy?: string;
  status: 'available' | 'claimed' | 'expired';
  holdingLocation: string;
}

export type Item = LostItem | FoundItem;

export interface Match {
  id: string;
  lostItemId: string;
  foundItemId: string;
  score: number; // 0-100, confidence score
  matchedBy: string; // "algorithm" or userId
  status: 'pending' | 'confirmed' | 'rejected' | 'expired';
  createdAt: Date;
  updatedAt: Date;
  algorithmVersion: string;
  matchFactors: {
    locationScore: number;
    categoryScore: number;
    descriptionScore: number;
    timeScore: number;
  };
  lostItem?: LostItem;
  foundItem?: FoundItem;
}

export interface Rating {
  id: string;
  matchId: string;
  raterId: string;
  ratedUserId: string;
  rating: number; // 1-5
  review?: string;
  isPositive: boolean;
  transactionType: 'itemReturned' | 'itemClaimed';
  createdAt: Date;
}

// Enums
export type ItemCategory = 'electronics' | 'jewelry' | 'documents' | 'clothing' | 'accessories' | 'pets' | 'other';
export type ContactPreference = 'inApp' | 'phone' | 'email';

// Form types
export interface ReportItemData {
  title: string;
  description: string;
  category: ItemCategory;
  subcategory?: string;
  dateLost?: Date;
  dateFound?: Date;
  location: {
    address: string;
    description: string;
    latitude: number;
    longitude: number;
    city: string;
    state: string;
  };
  photos: string[];
  contactPreference: ContactPreference;
  reward?: number;
  holdingLocation?: string;
}