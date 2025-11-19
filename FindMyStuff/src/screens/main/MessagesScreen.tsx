import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Card from '../../components/Card';
import {Conversation} from '../../types/messages';
import MessagingService from '../../services/messagingService';
import {useAuth} from '../../store/AuthContext';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../navigation/AppNavigator';
import Colors from '../../constants/colors';
import Typography from '../../constants/typography';
import Spacing from '../constants/spacing';

type MessagesNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

const MessagesScreen = () => {
  const navigation = useNavigation<MessagesNavigationProp>();
  const {user} = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadConversations();
    loadUnreadCount();
  }, []);

  const loadConversations = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userConversations = await MessagingService.getConversations(user.uid);
      setConversations(userConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    if (!user) return;

    try {
      const count = await MessagingService.getUnreadCount(user.uid);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadConversations();
    loadUnreadCount();
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleConversationPress = (conversation: Conversation) => {
    navigation.navigate('Chat', {
      matchId: conversation.matchId,
      userName: conversation.otherUserName,
    });
  };

  const renderConversation = ({item}: {item: Conversation}) => {
    const {otherUserPhoto, itemPhoto, otherUserName, lastMessage, unreadCount, itemType, itemTitle} = item;

    return (
      <TouchableOpacity
        style={styles.conversationContainer}
        onPress={() => handleConversationPress(item)}>
        <Card margin="sm" padding="md">
          <View style={styles.conversationHeader}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                {otherUserPhoto ? (
                  <Image source={{uri: otherUserPhoto}} style={styles.avatarImage} />
                ) : (
                  <View style={styles.defaultAvatar}>
                    <Icon name="person" size={24} color={Colors.neutral} />
                  </View>
                )}
              </View>

              <View style={styles.userDetails}>
                <View style={styles.nameRow}>
                  <Text style={styles.userName}>{otherUserName}</Text>
                  {unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{unreadCount}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.itemInfo}>
                  <Text style={styles.itemType}>
                    {itemType === 'lost' ? 'Lost' : 'Found'} Item
                  </Text>
                  <Text style={styles.itemTitle}>{itemTitle}</Text>
                </View>
              </View>
            </View>

            {itemPhoto && (
              <Image source={{uri: itemPhoto}} style={styles.itemImage} />
            )}
          </View>

          {lastMessage && (
            <View style={styles.lastMessage}>
              <Text style={styles.lastMessageText} numberOfLines={2}>
                {lastMessage.messageType === 'location'
                  ? '📍 Shared location'
                  : lastMessage.content}
              </Text>
              <Text style={styles.lastMessageTime}>
                {formatLastMessageTime(item.lastActivity)}
              </Text>
            </View>
          )}

          <View style={styles.conversationFooter}>
            <View style={styles.matchScore}>
              <Icon name="check-circle" size={16} color={matchScoreColor(item.matchScore)} />
              <Text style={[styles.matchScoreText, {color: matchScoreColor(item.matchScore)}]}>
                {item.matchScore}% match
              </Text>
            </View>

            <Text style={styles.statusText}>
              {item.isActive ? 'Active' : 'Closed'}
            </Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const formatLastMessageTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const matchScoreColor = (score: number): string => {
    if (score >= 85) return Colors.highMatch;
    if (score >= 70) return Colors.mediumMatch;
    return Colors.lowMatch;
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="chat" size={64} color={Colors.neutralLight} />
      <Text style={styles.emptyStateTitle}>No conversations yet</Text>
      <Text style={styles.emptyStateText}>
        When you match with lost or found items, your conversations will appear here.
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading) return null;

    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  };

  if (loading && conversations.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        {unreadCount > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screen.horizontal,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    ...Typography.headline,
    color: Colors.textPrimary,
  },
  headerBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  headerBadgeText: {
    ...Typography.caption,
    color: Colors.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: Spacing.screen.horizontal,
    paddingBottom: Spacing.xxxl,
  },
  conversationContainer: {
    marginBottom: Spacing.sm,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  avatar: {
    marginRight: Spacing.md,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  defaultAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  userDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  userName: {
    ...Typography.subtitle,
    fontSize: TypographyFontSize.base,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    ...Typography.caption,
    color: Colors.background,
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemType: {
    ...Typography.caption,
    color: Colors.neutral,
    marginRight: Spacing.sm,
  },
  itemTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: Spacing.borderRadius.md,
    marginLeft: Spacing.md,
  },
  lastMessage: {
    marginBottom: Spacing.sm,
  },
  lastMessageText: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  lastMessageTime: {
    ...Typography.caption,
    color: Colors.neutral,
    marginTop: Spacing.xs,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchScore: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchScoreText: {
    ...Typography.caption,
    marginLeft: Spacing.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  statusText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  loadingContainer: {
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
  footer: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  emptyStateTitle: {
    ...Typography.headline,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyStateText: {
    ...Typography.body,
    color: Colors.textDisabled,
    textAlign: 'center',
    lineHeight: 22,
  },
});

// Fix the TypographyFontSize reference
const TypographyFontSize = {
  base: 16,
};

export default MessagesScreen;