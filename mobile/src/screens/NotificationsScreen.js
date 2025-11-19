import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { notificationsAPI } from '../services/api';

const NotificationsScreen = () => {
  const navigation = useNavigation();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async (reset = false) => {
    try {
      if (reset) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await notificationsAPI.getNotifications();
      setNotifications(response.data.data || []);
    } catch (error) {
      console.error('Load notifications error:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );
    } catch (error) {
      console.error('Mark all as read error:', error);
    }
  };

  const handleNotificationPress = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navigate to related item if available
    if (notification.related_item_id) {
      navigation.navigate('ItemDetails', { itemId: notification.related_item_id });
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'match_found':
        return 'search';
      case 'claim_status':
        return 'gavel';
      case 'verification_required':
        return 'verified-user';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'match_found':
        return '#51cf66';
      case 'claim_status':
        return '#2196F3';
      case 'verification_required':
        return '#ffd43b';
      default:
        return '#868e96';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !item.is_read && styles.unreadNotification,
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(item.type) }]}>
        <Icon name={getNotificationIcon(item.type)} size={20} color="white" />
      </View>

      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={[styles.notificationTitle, !item.is_read && styles.unreadTitle]}>
            {item.title}
          </Text>
          {!item.is_read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notificationMessage} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.notificationTime}>
          {formatDate(item.created_at)}
        </Text>
      </View>

      <Icon name="chevron-right" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Unread Count */}
      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Icon name="notifications-active" size={16} color="#2196F3" />
          <Text style={styles.unreadBannerText}>
            {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadNotifications(true)} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="notifications-off" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>
              We'll notify you about important updates
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  markAllButton: {
    paddingHorizontal: 8,
  },
  markAllText: {
    color: '#2196F3',
    fontSize: 14,
  },
  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  unreadBannerText: {
    fontSize: 14,
    color: '#2196F3',
    marginLeft: 8,
  },
  list: {
    flex: 1,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  unreadNotification: {
    backgroundColor: '#f8f9ff',
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
  },
});

export default NotificationsScreen;