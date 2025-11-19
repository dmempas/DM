import firestore from '@react-native-firebase/firestore';
import {Message, Conversation} from '../types/messages';
import {User} from '../types/auth';
import {Match} from '../types/items';

class MessagingService {
  /**
   * Send a message in a conversation
   */
  async sendMessage(
    matchId: string,
    senderId: string,
    receiverId: string,
    content: string,
    messageType: 'text' | 'image' | 'location' = 'text',
    imageUrl?: string,
    location?: {latitude: number; longitude: number; address: string}
  ): Promise<Message> {
    try {
      const messageData = {
        matchId,
        senderId,
        receiverId,
        content: content.trim(),
        messageType,
        imageUrl,
        location,
        isRead: false,
        createdAt: firestore.FieldValue.serverTimestamp(),
      };

      const messageRef = await firestore().collection('messages').add(messageData);

      // Update match last activity
      await firestore()
        .collection('matches')
        .doc(matchId)
        .update({
          lastMessageAt: firestore.FieldValue.serverTimestamp(),
          lastMessage: content.trim(),
        });

      return {
        id: messageRef.id,
        ...messageData,
        createdAt: new Date(),
      } as Message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(
    matchId: string,
    limit: number = 50
  ): Promise<Message[]> {
    try {
      const snapshot = await firestore()
        .collection('messages')
        .where('matchId', '==', matchId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        readAt: doc.data().readAt?.toDate(),
      })) as Message[];

      return messages.reverse(); // Show oldest messages first
    } catch (error) {
      console.error('Error getting messages:', error);
      throw new Error('Failed to load messages');
    }
  }

  /**
   * Listen to real-time message updates for a conversation
   */
  subscribeToMessages(
    matchId: string,
    callback: (messages: Message[]) => void
  ): () => void {
    const unsubscribe = firestore()
      .collection('messages')
      .where('matchId', '==', matchId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .onSnapshot((snapshot) => {
        const messages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          readAt: doc.data().readAt?.toDate(),
        })) as Message[];

        callback(messages.reverse());
      }, (error) => {
        console.error('Error subscribing to messages:', error);
      });

    return unsubscribe;
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(matchId: string, userId: string): Promise<void> {
    try {
      const batch = firestore().batch();

      const messagesSnapshot = await firestore()
        .collection('messages')
        .where('matchId', '==', matchId)
        .where('receiverId', '==', userId)
        .where('isRead', '==', false)
        .get();

      messagesSnapshot.forEach((doc) => {
        batch.update(doc.ref, {
          isRead: true,
          readAt: firestore.FieldValue.serverTimestamp(),
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw new Error('Failed to mark messages as read');
    }
  }

  /**
   * Get conversations for a user
   */
  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      // Get matches where user is involved
      const matchesSnapshot = await firestore()
        .collection('matches')
        .where('userId', '==', userId)
        .get();

      const otherMatchesSnapshot = await firestore()
        .collection('matches')
        .where('matchedUserId', '==', userId)
        .get();

      const allMatches = [
        ...matchesSnapshot.docs,
        ...otherMatchesSnapshot.docs,
      ];

      const conversations: Conversation[] = [];

      for (const matchDoc of allMatches) {
        const matchData = matchDoc.data() as Match;

        // Get the other user's ID
        const otherUserId = matchData.userId === userId ? matchData.matchedUserId : matchData.userId;
        if (!otherUserId) continue;

        // Get other user's info
        const userDoc = await firestore()
          .collection('users')
          .doc(otherUserId)
          .get();

        const userData = userDoc.exists ? userDoc.data() as User : null;

        // Get last message
        const lastMessageSnapshot = await firestore()
          .collection('messages')
          .where('matchId', '==', matchDoc.id)
          .orderBy('createdAt', 'desc')
          .limit(1)
          .get();

        const lastMessage = lastMessageSnapshot.docs.length > 0
          ? {
              ...lastMessageSnapshot.docs[0].data(),
              createdAt: lastMessageSnapshot.docs[0].data().createdAt?.toDate(),
            } as Message
          : null;

        // Get unread count
        const unreadSnapshot = await firestore()
          .collection('messages')
          .where('matchId', '==', matchDoc.id)
          .where('receiverId', '==', userId)
          .where('isRead', '==', false)
          .get();

        // Get item info
        const isLostOwner = matchData.userId === userId;
        const itemCollection = isLostOwner ? 'foundItems' : 'lostItems';
        const itemId = isLostOwner ? matchData.foundItemId : matchData.lostItemId;

        let itemTitle = 'Unknown Item';
        let itemType: 'lost' | 'found' = 'lost';
        let itemPhoto: string | undefined;

        if (itemId) {
          const itemDoc = await firestore()
            .collection(itemCollection)
            .doc(itemId)
            .get();

          if (itemDoc.exists) {
            const itemData = itemDoc.data();
            itemTitle = itemData.title || 'Unknown Item';
            itemType = itemCollection === 'lostItems' ? 'lost' : 'found';
            itemPhoto = itemData.photos?.[0];
          }
        }

        conversations.push({
          id: matchDoc.id,
          matchId: matchDoc.id,
          otherUserId,
          otherUserName: userData?.displayName || 'Unknown User',
          otherUserPhoto: userData?.photoURL,
          lastMessage: lastMessage || {
            id: '',
            matchId: matchDoc.id,
            senderId: '',
            receiverId: '',
            content: 'Start a conversation',
            messageType: 'text',
            isRead: true,
            createdAt: matchData.createdAt?.toDate() || new Date(),
          },
          unreadCount: unreadSnapshot.size,
          isActive: matchData.status === 'pending' || matchData.status === 'confirmed',
          lastActivity: lastMessage?.createdAt || matchData.createdAt?.toDate() || new Date(),
          matchScore: matchData.score,
          itemType,
          itemTitle,
          itemPhoto,
        });
      }

      // Sort by last activity
      return conversations.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
    } catch (error) {
      console.error('Error getting conversations:', error);
      throw new Error('Failed to load conversations');
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    try {
      const messageDoc = await firestore()
        .collection('messages')
        .doc(messageId)
        .get();

      if (!messageDoc.exists) {
        throw new Error('Message not found');
      }

      const messageData = messageDoc.data();

      // Only allow sender to delete their own messages
      if (messageData?.senderId !== userId) {
        throw new Error('You can only delete your own messages');
      }

      await messageDoc.ref.delete();
    } catch (error) {
      console.error('Error deleting message:', error);
      throw new Error('Failed to delete message');
    }
  }

  /**
   * Report a message
   */
  async reportMessage(
    messageId: string,
    reporterId: string,
    reason: string
  ): Promise<void> {
    try {
      const messageDoc = await firestore()
        .collection('messages')
        .doc(messageId)
        .get();

      if (!messageDoc.exists) {
        throw new Error('Message not found');
      }

      // Create report record
      await firestore().collection('reportedMessages').add({
        messageId,
        reporterId,
        reason,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      // You could also add logic to notify moderators here
    } catch (error) {
      console.error('Error reporting message:', error);
      throw new Error('Failed to report message');
    }
  }

  /**
   * Block a user
   */
  async blockUser(blockerId: string, blockedUserId: string): Promise<void> {
    try {
      await firestore().collection('blockedUsers').add({
        blockerId,
        blockedUserId,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Error blocking user:', error);
      throw new Error('Failed to block user');
    }
  }

  /**
   * Check if user is blocked
   */
  async isUserBlocked(userId: string, otherUserId: string): Promise<boolean> {
    try {
      const snapshot = await firestore()
        .collection('blockedUsers')
        .where('blockerId', '==', otherUserId)
        .where('blockedUserId', '==', userId)
        .get();

      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking blocked status:', error);
      return false;
    }
  }

  /**
   * Get quick replies
   */
  getQuickReplies(): Array<{text: string; category: string}> {
    return [
      {text: 'Is the item still available?', category: 'question'},
      {text: 'Can you provide more details?', category: 'question'},
      {text: 'When and where can we meet?', category: 'location'},
      {text: 'I can meet today', category: 'time'},
      {text: 'Thank you!', category: 'confirmation'},
      {text: 'This looks like my item', category: 'confirmation'},
    ];
  }

  /**
   * Get unread message count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const snapshot = await firestore()
        .collection('messages')
        .where('receiverId', '==', userId)
        .where('isRead', '==', false)
        .get();

      return snapshot.size;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }
}

export default new MessagingService();