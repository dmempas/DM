import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GeoFirestore } from 'geofirestore-common';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

// Interfaces
interface Location {
  type: 'Point';
  coordinates: [number, number];
  address: string;
  city: string;
  state: string;
  description: string;
}

interface BaseItem {
  userId: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  location: Location;
  photos: string[];
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  tags: string[];
  contactPreference: string;
}

interface LostItem extends BaseItem {
  type: 'lost';
  dateLost: admin.firestore.Timestamp;
  isFound: boolean;
  foundBy?: string;
  status: 'active' | 'resolved' | 'expired';
  reward?: number;
}

interface FoundItem extends BaseItem {
  type: 'found';
  dateFound: admin.firestore.Timestamp;
  isClaimed: boolean;
  claimedBy?: string;
  status: 'available' | 'claimed' | 'expired';
  holdingLocation: string;
}

interface MatchFactors {
  locationScore: number;
  categoryScore: number;
  descriptionScore: number;
  timeScore: number;
}

// Helper functions
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const tokenizeDescription = (description: string): string[] => {
  return description.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .filter(word => !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'was', 'were', 'been', 'have', 'has', 'had', 'will', 'would', 'could', 'should'].includes(word));
};

const calculateJaccardSimilarity = (set1: Set<string>, set2: Set<string>): number => {
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return union.size === 0 ? 0 : intersection.size / union.size;
};

const calculateMatchScore = (
  lostItem: LostItem,
  foundItem: FoundItem
): { score: number; factors: MatchFactors } => {
  // Location Score (40%)
  const lostCoords = lostItem.location.coordinates;
  const foundCoords = foundItem.location.coordinates;
  const distance = calculateDistance(
    lostCoords[1], lostCoords[0],
    foundCoords[1], foundCoords[0]
  );

  // Location score decreases with distance (max 25 miles)
  const locationScore = Math.max(0, 1 - (distance / 25)) * 100;

  // Category Score (25%)
  const categoryScore = lostItem.category === foundItem.category ? 100 :
    (lostItem.subcategory === foundItem.subcategory ? 75 : 0);

  // Description Score (25%)
  const lostTokens = new Set(tokenizeDescription(lostItem.description));
  const foundTokens = new Set(tokenizeDescription(foundItem.description));
  const titleTokens = new Set(tokenizeDescription(lostItem.title + ' ' + foundItem.title));
  const descriptionSimilarity = calculateJaccardSimilarity(lostTokens, foundTokens);
  const titleSimilarity = calculateJaccardSimilarity(titleTokens, new Set([]));
  const descriptionScore = (descriptionSimilarity * 0.7 + titleSimilarity * 0.3) * 100;

  // Time Score (10%)
  const lostDate = lostItem.dateLost.toDate();
  const foundDate = foundItem.dateFound.toDate();
  const daysDiff = Math.abs((foundDate.getTime() - lostDate.getTime()) / (1000 * 60 * 60 * 24));
  const timeScore = Math.max(0, 1 - (daysDiff / 30)) * 100; // Within 30 days is good

  // Final weighted score
  const finalScore = (
    locationScore * 0.4 +
    categoryScore * 0.25 +
    descriptionScore * 0.25 +
    timeScore * 0.1
  );

  return {
    score: Math.round(finalScore),
    factors: {
      locationScore: Math.round(locationScore),
      categoryScore: Math.round(categoryScore),
      descriptionScore: Math.round(descriptionScore),
      timeScore: Math.round(timeScore),
    }
  };
};

// Cloud Functions

// Authentication Functions
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  try {
    const userDoc = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || '',
      photoURL: user.photoURL || null,
      phoneNumber: user.phoneNumber || null,
      isVerified: user.emailVerified || false,
      averageRating: 0,
      totalRatings: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
      preferences: {
        maxDistance: 25,
        notifications: {
          newMatches: true,
          messages: true,
          itemUpdates: true,
        },
      },
    };

    await db.collection('users').doc(user.uid).set(userDoc);

    // Send welcome email (would require email service integration)
    console.log(`User created: ${user.uid}`);
  } catch (error) {
    console.error('Error creating user document:', error);
  }
});

// Matching Functions
export const findMatchesForLostItem = functions.firestore
  .document('lostItems/{itemId}')
  .onCreate(async (snap, context) => {
    const lostItem = snap.data() as LostItem;
    const itemId = context.params.itemId;

    try {
      // Query nearby found items within 25 miles
      const foundItemsQuery = await db.collection('foundItems')
        .where('status', '==', 'available')
        .where('category', '==', lostItem.category)
        .get();

      const matches: any[] = [];

      for (const foundDoc of foundItemsQuery.docs) {
        const foundItem = foundDoc.data() as FoundItem;

        const { score, factors } = calculateMatchScore(lostItem, foundItem);

        // Only create matches with score >= 70
        if (score >= 70) {
          const match = {
            lostItemId: itemId,
            foundItemId: foundDoc.id,
            score,
            matchedBy: 'algorithm',
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            algorithmVersion: '1.0',
            matchFactors: factors,
          };

          const matchRef = await db.collection('matches').add(match);
          matches.push({ id: matchRef.id, ...match });
        }
      }

      console.log(`Created ${matches.length} matches for lost item: ${itemId}`);

      // Send notifications for high-confidence matches
      for (const match of matches.filter(m => m.score >= 85)) {
        await sendMatchNotification(lostItem.userId, match.id, match.score);
      }

    } catch (error) {
      console.error('Error finding matches for lost item:', error);
    }
  });

export const findMatchesForFoundItem = functions.firestore
  .document('foundItems/{itemId}')
  .onCreate(async (snap, context) => {
    const foundItem = snap.data() as FoundItem;
    const itemId = context.params.itemId;

    try {
      // Query nearby lost items within 25 miles
      const lostItemsQuery = await db.collection('lostItems')
        .where('status', '==', 'active')
        .where('category', '==', foundItem.category)
        .get();

      const matches: any[] = [];

      for (const lostDoc of lostItemsQuery.docs) {
        const lostItem = lostDoc.data() as LostItem;

        const { score, factors } = calculateMatchScore(lostItem, foundItem);

        // Only create matches with score >= 70
        if (score >= 70) {
          const match = {
            lostItemId: lostDoc.id,
            foundItemId: itemId,
            score,
            matchedBy: 'algorithm',
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            algorithmVersion: '1.0',
            matchFactors: factors,
          };

          const matchRef = await db.collection('matches').add(match);
          matches.push({ id: matchRef.id, ...match });
        }
      }

      console.log(`Created ${matches.length} matches for found item: ${itemId}`);

      // Send notifications for high-confidence matches
      for (const match of matches.filter(m => m.score >= 85)) {
        await sendMatchNotification(lostItem.userId, match.id, match.score);
      }

    } catch (error) {
      console.error('Error finding matches for found item:', error);
    }
  });

// Notification Functions
const sendMatchNotification = async (userId: string, matchId: string, score: number) => {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.fcmToken || !userData?.preferences?.notifications?.newMatches) {
      return;
    }

    const message = {
      token: userData.fcmToken,
      notification: {
        title: 'Possible match found!',
        body: score >= 85
          ? 'We found a high-confidence match for your item'
          : 'We found a possible match for your item',
      },
      data: {
        type: 'match',
        matchId,
        score: score.toString(),
      },
      android: {
        priority: score >= 85 ? 'high' : 'normal',
      },
      apns: {
        payload: {
          aps: {
            badge: 1,
            sound: 'default',
          },
        },
      },
    };

    await admin.messaging().send(message);
    console.log(`Match notification sent to user: ${userId}`);
  } catch (error) {
    console.error('Error sending match notification:', error);
  }
};

// Rating Functions
export const updateUserRating = functions.firestore
  .document('ratings/{ratingId}')
  .onCreate(async (snap, context) => {
    const rating = snap.data();
    const ratedUserId = rating.ratedUserId;

    try {
      // Get all ratings for the user
      const ratingsSnapshot = await db.collection('ratings')
        .where('ratedUserId', '==', ratedUserId)
        .get();

      let totalRating = 0;
      ratingsSnapshot.forEach(doc => {
        totalRating += doc.data().rating;
      });

      const averageRating = totalRating / ratingsSnapshot.size;
      const totalRatings = ratingsSnapshot.size;

      // Update user document
      await db.collection('users').doc(ratedUserId).update({
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        totalRatings,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Updated rating for user ${ratedUserId}: ${averageRating}/5 (${totalRatings} ratings)`);
    } catch (error) {
      console.error('Error updating user rating:', error);
    }
  });

// Cleanup Functions
export const cleanupExpiredItems = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    try {
      const thirtyDaysAgo = admin.firestore.Timestamp.fromDate(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      );

      // Mark old lost items as expired
      const oldLostItems = await db.collection('lostItems')
        .where('status', '==', 'active')
        .where('createdAt', '<', thirtyDaysAgo)
        .get();

      const batch = db.batch();
      oldLostItems.forEach(doc => {
        batch.update(doc.ref, {
          status: 'expired',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      // Mark old found items as expired
      const oldFoundItems = await db.collection('foundItems')
        .where('status', '==', 'available')
        .where('createdAt', '<', thirtyDaysAgo)
        .get();

      oldFoundItems.forEach(doc => {
        batch.update(doc.ref, {
          status: 'expired',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      await batch.commit();
      console.log(`Cleaned up ${oldLostItems.size + oldFoundItems.size} expired items`);
    } catch (error) {
      console.error('Error cleaning up expired items:', error);
    }
  });