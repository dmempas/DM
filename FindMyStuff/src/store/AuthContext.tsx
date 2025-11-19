import React, {createContext, useContext, useEffect, useState} from 'react';
import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {User} from '../types/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Convert Firebase user to our User type
  const formatUser = async (firebaseUser: FirebaseAuthTypes.User): Promise<User> => {
    const userDoc = await firestore()
      .collection('users')
      .doc(firebaseUser.uid)
      .get();

    const userData = userDoc.exists ? userDoc.data() : {};

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: userData?.displayName || firebaseUser.displayName || '',
      photoURL: userData?.photoURL || firebaseUser.photoURL || null,
      phoneNumber: userData?.phoneNumber || firebaseUser.phoneNumber || null,
      isVerified: firebaseUser.emailVerified || false,
      averageRating: userData?.averageRating || 0,
      totalRatings: userData?.totalRatings || 0,
      createdAt: userData?.createdAt?.toDate() || new Date(),
      lastActiveAt: userData?.lastActiveAt?.toDate() || new Date(),
      location: userData?.location || null,
      preferences: userData?.preferences || {
        maxDistance: 25,
        notifications: {
          newMatches: true,
          messages: true,
          itemUpdates: true,
        },
      },
      fcmToken: userData?.fcmToken || null,
    };
  };

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async firebaseUser => {
      if (firebaseUser) {
        const formattedUser = await formatUser(firebaseUser);
        setUser(formattedUser);

        // Update last active timestamp
        await firestore()
          .collection('users')
          .doc(firebaseUser.uid)
          .update({
            lastActiveAt: firestore.FieldValue.serverTimestamp(),
          });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);

      // Update display name
      await userCredential.user?.updateProfile({displayName});

      // Create user document in Firestore
      const userData = {
        uid: userCredential.user?.uid,
        email: userCredential.user?.email,
        displayName,
        photoURL: userCredential.user?.photoURL || null,
        phoneNumber: userCredential.user?.phoneNumber || null,
        isVerified: userCredential.user?.emailVerified || false,
        averageRating: 0,
        totalRatings: 0,
        createdAt: firestore.FieldValue.serverTimestamp(),
        lastActiveAt: firestore.FieldValue.serverTimestamp(),
        preferences: {
          maxDistance: 25,
          notifications: {
            newMatches: true,
            messages: true,
            itemUpdates: true,
          },
        },
      };

      await firestore()
        .collection('users')
        .doc(userCredential.user?.uid)
        .set(userData);

      // Send email verification
      await userCredential.user?.sendEmailVerification();

    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await auth().signOut();
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await auth().sendPasswordResetEmail(email);
    } catch (error) {
      throw error;
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    try {
      if (!user) {
        throw new Error('No authenticated user');
      }

      const updateData: any = {};

      // Handle Firebase Auth profile updates
      if (updates.displayName) {
        await auth().currentUser?.updateProfile({displayName: updates.displayName});
        updateData.displayName = updates.displayName;
      }

      if (updates.photoURL !== undefined) {
        await auth().currentUser?.updateProfile({photoURL: updates.photoURL});
        updateData.photoURL = updates.photoURL;
      }

      // Update Firestore document
      if (Object.keys(updateData).length > 0) {
        updateData.updatedAt = firestore.FieldValue.serverTimestamp();

        await firestore()
          .collection('users')
          .doc(user.uid)
          .update(updateData);

        // Update local user state
        setUser(prev => prev ? {...prev, ...updateData} : null);
      }
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};