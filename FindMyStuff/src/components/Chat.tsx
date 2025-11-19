import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Message} from '../types/messages';
import {User} from '../types/auth';
import MessagingService from '../services/messagingService';
import Colors from '../constants/colors';
import Typography from '../constants/typography';
import Spacing from '../constants/spacing';

interface ChatProps {
  matchId: string;
  currentUserId: string;
  otherUser: User;
  itemTitle: string;
  itemType: 'lost' | 'found';
}

interface QuickReply {
  text: string;
  category: string;
}

const Chat: React.FC<ChatProps> = ({
  matchId,
  currentUserId,
  otherUser,
  itemTitle,
  itemType,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [quickReplies] = useState<QuickReply[]>(MessagingService.getQuickReplies());

  const flatListRef = useRef<FlatList>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    subscribeToMessages();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [matchId]);

  useEffect(() => {
    markMessagesAsRead();
  }, [messages]);

  const subscribeToMessages = () => {
    unsubscribeRef.current = MessagingService.subscribeToMessages(
      matchId,
      (updatedMessages) => {
        setMessages(updatedMessages);
        // Auto-scroll to bottom when new messages arrive
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({animated: true});
        }, 100);
      }
    );
  };

  const markMessagesAsRead = async () => {
    const unreadMessages = messages.filter(
      (msg) => msg.receiverId === currentUserId && !msg.isRead
    );

    if (unreadMessages.length > 0) {
      try {
        await MessagingService.markMessagesAsRead(matchId, currentUserId);
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
  };

  const sendMessage = async (content: string, messageType: 'text' | 'image' | 'location' = 'text') => {
    if (!content.trim()) return;

    try {
      setIsTyping(true);
      await MessagingService.sendMessage(
        matchId,
        currentUserId,
        otherUser.uid,
        content.trim(),
        messageType
      );
      setNewMessage('');
      setShowQuickReplies(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickReply = (quickReply: QuickReply) => {
    sendMessage(quickReply.text);
  };

  const handleImageUpload = () => {
    // Implement image upload functionality
    Alert.alert('Image Upload', 'Image upload coming soon!');
  };

  const handleLocationShare = () => {
    // Implement location sharing functionality
    Alert.alert('Location Share', 'Location sharing coming soon!');
  };

  const renderMessage = ({item, index}: {item: Message; index: number}) => {
    const isOwnMessage = item.senderId === currentUserId;
    const showTime = index === messages.length - 1 ||
      messages[index + 1]?.senderId !== item.senderId;

    if (item.messageType === 'text') {
      return (
        <View
          style={[
            styles.messageContainer,
            isOwnMessage ? styles.ownMessage : styles.otherMessage,
          ]}>
          <View
            style={[
              styles.messageBubble,
              isOwnMessage ? styles.ownBubble : styles.otherBubble,
            ]}>
            <Text
              style={[
                styles.messageText,
                isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
              ]}>
              {item.content}
            </Text>
            {showTime && (
              <Text
                style={[
                  styles.messageTime,
                  isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
                ]}>
                {formatMessageTime(item.createdAt)}
              </Text>
            )}
          </View>
        </View>
      );
    }

    if (item.messageType === 'image' && item.imageUrl) {
      return (
        <View
          style={[
            styles.messageContainer,
            isOwnMessage ? styles.ownMessage : styles.otherMessage,
          ]}>
          <View
            style={[
              styles.messageBubble,
              styles.imageBubble,
              isOwnMessage ? styles.ownBubble : styles.otherBubble,
            ]}>
            <Image source={{uri: item.imageUrl}} style={styles.messageImage} />
            {showTime && (
              <Text
                style={[
                  styles.messageTime,
                  isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
                ]}>
                {formatMessageTime(item.createdAt)}
              </Text>
            )}
          </View>
        </View>
      );
    }

    if (item.messageType === 'location' && item.location) {
      return (
        <View
          style={[
            styles.messageContainer,
            isOwnMessage ? styles.ownMessage : styles.otherMessage,
          ]}>
          <View
            style={[
              styles.messageBubble,
              styles.locationBubble,
              isOwnMessage ? styles.ownBubble : styles.otherBubble,
            ]}>
            <View style={styles.locationContent}>
              <Icon name="location-on" size={20} color={Colors.primary} />
              <Text style={styles.locationText}>{item.location.address}</Text>
            </View>
            {showTime && (
              <Text
                style={[
                  styles.messageTime,
                  isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
                ]}>
                {formatMessageTime(item.createdAt)}
              </Text>
            )}
          </View>
        </View>
      );
    }

    return null;
  };

  const formatMessageTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleInputChange = (text: string) => {
    setNewMessage(text);
    setShowQuickReplies(text.length === 0 && messages.length === 0);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{otherUser.displayName}</Text>
          <Text style={styles.headerSubtitle}>About: {itemTitle}</Text>
        </View>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => {
            Alert.alert(
              'More Options',
              'What would you like to do?',
              [
                {text: 'Cancel', style: 'cancel'},
                {text: 'View Profile', onPress: () => {/* Navigate to profile */}},
                {text: 'Block User', style: 'destructive', onPress: () => {
                  Alert.alert(
                    'Block User',
                    'Are you sure you want to block this user?',
                    [
                      {text: 'Cancel', style: 'cancel'},
                      {text: 'Block', style: 'destructive', onPress: () => {
                        // Implement block functionality
                      }},
                    ]
                  );
                }},
              ]
            );
          }}>
          <Icon name="more-vert" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({animated: true});
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="chat" size={64} color={Colors.neutralLight} />
            <Text style={styles.emptyStateTitle}>Start the conversation</Text>
            <Text style={styles.emptyStateText}>
              Send a message to discuss the {itemType} item
            </Text>
          </View>
        }
      />

      {/* Quick Replies */}
      {showQuickReplies && (
        <View style={styles.quickRepliesContainer}>
          {quickReplies.slice(0, 3).map((quickReply, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickReply}
              onPress={() => handleQuickReply(quickReply)}>
              <Text style={styles.quickReplyText}>{quickReply.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.attachButton}
          onPress={handleImageUpload}>
          <Icon name="photo-camera" size={24} color={Colors.neutral} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.attachButton}
          onPress={handleLocationShare}>
          <Icon name="location-on" size={24} color={Colors.neutral} />
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={handleInputChange}
          multiline
          maxLength={500}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newMessage.trim() || isTyping) && styles.disabledSendButton,
          ]}
          onPress={() => sendMessage(newMessage)}
          disabled={!newMessage.trim() || isTyping}>
          {isTyping ? (
            <Icon name="hourglass-empty" size={24} color={Colors.neutralLight} />
          ) : (
            <Icon name="send" size={24} color={Colors.background} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screen.horizontal,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.subtitle,
    fontSize: TypographyFontSize.base,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  moreButton: {
    padding: Spacing.sm,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: Spacing.md,
  },
  messageContainer: {
    marginVertical: 2,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: Spacing.sm,
    borderRadius: Spacing.borderRadius.lg,
    marginHorizontal: Spacing.sm,
  },
  ownBubble: {
    backgroundColor: Colors.primary,
  },
  otherBubble: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageText: {
    ...Typography.body,
    lineHeight: 20,
  },
  ownMessageText: {
    color: Colors.background,
  },
  otherMessageText: {
    color: Colors.textPrimary,
  },
  messageTime: {
    ...Typography.caption,
    fontSize: 10,
    marginTop: Spacing.xs,
    textAlign: 'right',
  },
  ownMessageTime: {
    color: Colors.background + '99',
  },
  otherMessageTime: {
    color: Colors.textDisabled,
  },
  imageBubble: {
    padding: Spacing.xs,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: Spacing.borderRadius.md,
    resizeMode: 'cover',
  },
  locationBubble: {
    padding: Spacing.sm,
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    ...Typography.body,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
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
  },
  quickRepliesContainer: {
    paddingHorizontal: Spacing.screen.horizontal,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
  },
  quickReply: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  quickReplyText: {
    ...Typography.body,
    color: Colors.primary,
    fontSize: Typography.fontSize.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.screen.horizontal,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  attachButton: {
    padding: Spacing.sm,
    marginHorizontal: Spacing.xs,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.xs,
    maxHeight: 100,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    borderRadius: Spacing.borderRadius.full,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
  },
  disabledSendButton: {
    backgroundColor: Colors.neutralLight,
  },
});

// Fix the TypographyFontSize reference
const TypographyFontSize = {
  base: 16,
};

export default Chat;