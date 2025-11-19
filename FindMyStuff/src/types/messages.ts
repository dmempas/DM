import {User} from './auth';

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  receiverId: string;
  content: string;
  messageType: 'text' | 'image' | 'location';
  imageUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
  sender?: User;
  receiver?: User;
}

export interface Conversation {
  id: string;
  matchId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserPhoto?: string;
  lastMessage: Message;
  unreadCount: number;
  isActive: boolean;
  lastActivity: Date;
  matchScore: number;
  itemType: 'lost' | 'found';
  itemTitle: string;
  itemPhoto?: string;
}

export interface QuickReply {
  id: string;
  text: string;
  category: 'greeting' | 'question' | 'confirmation' | 'location' | 'time';
}

export interface MessageAttachment {
  type: 'image' | 'location';
  url?: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}