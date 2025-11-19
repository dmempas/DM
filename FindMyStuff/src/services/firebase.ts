import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import messaging from '@react-native-firebase/messaging';

class FirebaseService {
  constructor() {
    this.initializeFirebase();
  }

  private async initializeFirebase() {
    try {
      // Request FCM permissions
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        const token = await messaging().getToken();
        console.log('FCM Token:', token);
      }
    } catch (error) {
      console.log('Firebase initialization error:', error);
    }
  }

  // Auth service
  Auth = {
    currentUser: () => auth().currentUser,
    onAuthStateChanged: (callback: any) => auth().onAuthStateChanged(callback),
    signInWithEmailAndPassword: (email: string, password: string) =>
      auth().signInWithEmailAndPassword(email, password),
    createUserWithEmailAndPassword: (email: string, password: string) =>
      auth().createUserWithEmailAndPassword(email, password),
    signOut: () => auth().signOut(),
    sendPasswordResetEmail: (email: string) =>
      auth().sendPasswordResetEmail(email),
    updateProfile: (updates: {displayName?: string; photoURL?: string}) =>
      auth().currentUser?.updateProfile(updates),
    sendEmailVerification: () => auth().currentUser?.sendEmailVerification(),
  };

  // Firestore service
  Firestore = {
    // Users collection
    users: {
      get: (userId: string) => firestore().collection('users').doc(userId).get(),
      set: (userId: string, data: any) => firestore().collection('users').doc(userId).set(data),
      update: (userId: string, data: any) => firestore().collection('users').doc(userId).update(data),
      where: (field: string, operator: any, value: any) =>
        firestore().collection('users').where(field, operator, value),
    },

    // Lost items collection
    lostItems: {
      add: (data: any) => firestore().collection('lostItems').add(data),
      get: (itemId: string) => firestore().collection('lostItems').doc(itemId).get(),
      update: (itemId: string, data: any) => firestore().collection('lostItems').doc(itemId).update(data),
      delete: (itemId: string) => firestore().collection('lostItems').doc(itemId).delete(),
      where: (field: string, operator: any, value: any) =>
        firestore().collection('lostItems').where(field, operator, value),
      orderBy: (field: string, direction: 'asc' | 'desc' = 'desc') =>
        firestore().collection('lostItems').orderBy(field, direction),
      limit: (limit: number) => firestore().collection('lostItems').limit(limit),
    },

    // Found items collection
    foundItems: {
      add: (data: any) => firestore().collection('foundItems').add(data),
      get: (itemId: string) => firestore().collection('foundItems').doc(itemId).get(),
      update: (itemId: string, data: any) => firestore().collection('foundItems').doc(itemId).update(data),
      delete: (itemId: string) => firestore().collection('foundItems').doc(itemId).delete(),
      where: (field: string, operator: any, value: any) =>
        firestore().collection('foundItems').where(field, operator, value),
      orderBy: (field: string, direction: 'asc' | 'desc' = 'desc') =>
        firestore().collection('foundItems').orderBy(field, direction),
      limit: (limit: number) => firestore().collection('foundItems').limit(limit),
    },

    // Matches collection
    matches: {
      add: (data: any) => firestore().collection('matches').add(data),
      get: (matchId: string) => firestore().collection('matches').doc(matchId).get(),
      update: (matchId: string, data: any) => firestore().collection('matches').doc(matchId).update(data),
      where: (field: string, operator: any, value: any) =>
        firestore().collection('matches').where(field, operator, value),
      orderBy: (field: string, direction: 'asc' | 'desc' = 'desc') =>
        firestore().collection('matches').orderBy(field, direction),
    },

    // Messages collection
    messages: {
      add: (data: any) => firestore().collection('messages').add(data),
      where: (field: string, operator: any, value: any) =>
        firestore().collection('messages').where(field, operator, value),
      orderBy: (field: string, direction: 'asc' | 'desc' = 'desc') =>
        firestore().collection('messages').orderBy(field, direction),
      onSnapshot: (query: any, callback: any) =>
        firestore().collection('messages').where(query.field, query.operator, query.value).onSnapshot(callback),
    },

    // Ratings collection
    ratings: {
      add: (data: any) => firestore().collection('ratings').add(data),
      where: (field: string, operator: any, value: any) =>
        firestore().collection('ratings').where(field, operator, value),
    },

    // Geo queries helper
    geoQuery: (collection: string, centerLat: number, centerLng: number, radiusInMiles: number) => {
      // This is a simplified geo query. In production, you might want to use geohashes or a dedicated geospatial service
      const latDelta = radiusInMiles * 0.0145; // Approximate conversion
      const lngDelta = radiusInMiles * 0.0145;

      return firestore()
        .collection(collection)
        .where('location.coordinates.1', '>=', centerLat - latDelta)
        .where('location.coordinates.1', '<=', centerLat + latDelta)
        .where('location.coordinates.0', '>=', centerLng - lngDelta)
        .where('location.coordinates.0', '<=', centerLng + lngDelta);
    },

    // Server timestamp
    serverTimestamp: () => firestore.FieldValue.serverTimestamp(),
  };

  // Storage service
  Storage = {
    uploadFile: async (filePath: string, fileName: string, metadata?: any) => {
      const reference = storage().ref(fileName);
      await reference.putFile(filePath, metadata);
      return reference.getDownloadURL();
    },

    uploadImage: async (imageUri: string, fileName: string) => {
      const reference = storage().ref(`images/${fileName}`);
      await reference.putFile(imageUri, {
        contentType: 'image/jpeg',
      });
      return reference.getDownloadURL();
    },

    deleteFile: async (fileUrl: string) => {
      const reference = storage().refFromURL(fileUrl);
      return reference.delete();
    },
  };

  // Messaging service
  Messaging = {
    requestPermission: () => messaging().requestPermission(),
    getToken: () => messaging().getToken(),
    onMessage: (callback: any) => messaging().onMessage(callback),
    onNotificationOpenedApp: (callback: any) => messaging().onNotificationOpenedApp(callback),
    getInitialNotification: () => messaging().getInitialNotification(),
    subscribeToTopic: (topic: string) => messaging().subscribeToTopic(topic),
    unsubscribeFromTopic: (topic: string) => messaging().unsubscribeFromTopic(topic),
  };
}

export default new FirebaseService();