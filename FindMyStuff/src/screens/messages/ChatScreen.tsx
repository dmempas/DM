import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ActivityIndicator, Alert} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import Chat from '../../components/Chat';
import FirebaseService from '../../services/firebase';
import {useAuth} from '../../store/AuthContext';
import {User} from '../../types/auth';
import {Match} from '../../types/items';
import Colors from '../../constants/colors';
import Typography from '../../constants/typography';
import Spacing from '../../constants/spacing';

interface ChatScreenRoute {
  params: {
    matchId: string;
    userName: string;
  };
}

const ChatScreen = () => {
  const route = useRoute<ChatScreenRoute>();
  const navigation = useNavigation();
  const {user} = useAuth();
  const {matchId, userName} = route.params;

  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChatData();
  }, [matchId]);

  useEffect(() => {
    if (otherUser && match) {
      navigation.setOptions({
        title: otherUser.displayName,
      });
    }
  }, [otherUser, match, navigation]);

  const loadChatData = async () => {
    if (!user) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get match details
      const matchDoc = await FirebaseService.Firestore.matches.get(matchId);
      if (!matchDoc.exists) {
        setError('Match not found');
        setLoading(false);
        return;
      }

      const matchData = {
        id: matchDoc.id,
        ...matchDoc.data(),
        createdAt: matchDoc.data().createdAt?.toDate(),
        updatedAt: matchDoc.data().updatedAt?.toDate(),
      } as Match;

      setMatch(matchData);

      // Determine other user ID
      const otherUserId = matchData.userId === user.uid ? matchData.matchedUserId : matchData.userId;
      if (!otherUserId) {
        setError('Other user not found');
        setLoading(false);
        return;
      }

      // Get other user details
      const userDoc = await FirebaseService.Firestore.users.get(otherUserId);
      if (!userDoc.exists) {
        setError('User profile not found');
        setLoading(false);
        return;
      }

      setOtherUser({
        uid: userDoc.id,
        ...userDoc.data(),
        createdAt: userDoc.data().createdAt?.toDate() || new Date(),
        lastActiveAt: userDoc.data().lastActiveAt?.toDate() || new Date(),
      } as User);

    } catch (error) {
      console.error('Error loading chat data:', error);
      setError('Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  const getItemDetails = () => {
    if (!match || !user) return {title: 'Unknown Item', type: 'lost' as const};

    const isLostOwner = match.userId === user.uid;
    const itemCollection = isLostOwner ? 'foundItems' : 'lostItems';
    const itemId = isLostOwner ? match.foundItemId : match.lostItemId;

    return {
      title: 'Unknown Item',
      type: itemCollection === 'lostItems' ? 'lost' : 'found' as const,
    };
  };

  const renderLoading = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.loadingText}>Loading chat...</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.errorTitle}>Error</Text>
      <Text style={styles.errorMessage}>{error}</Text>
    </View>
  );

  if (loading) {
    return renderLoading();
  }

  if (error || !otherUser || !match || !user) {
    return renderError();
  }

  const {title: itemTitle, type: itemType} = getItemDetails();

  return (
    <View style={styles.container}>
      <Chat
        matchId={matchId}
        currentUserId={user.uid}
        otherUser={otherUser}
        itemTitle={itemTitle}
        itemType={itemType}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  errorTitle: {
    ...Typography.headline,
    color: Colors.error,
    marginBottom: Spacing.sm,
  },
  errorMessage: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default ChatScreen;