const knex = require('../config/database');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      clientId: process.env.FIREBASE_CLIENT_ID,
      authUri: process.env.FIREBASE_AUTH_URI,
      tokenUri: process.env.FIREBASE_TOKEN_URI,
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

/**
 * Create a notification in the database
 */
const createNotification = async (notificationData) => {
  try {
    const { user_id, title, message, type, related_item_id } = notificationData;

    const [notification] = await knex('notifications')
      .insert({
        id: require('uuid').v4(),
        user_id,
        title,
        message,
        type,
        related_item_id,
        is_read: false,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    // Send push notification if Firebase is configured
    await sendPushNotification(user_id, title, message, {
      type,
      related_item_id,
    });

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

/**
 * Send push notification via Firebase Cloud Messaging
 */
const sendPushNotification = async (userId, title, message, data = {}) => {
  try {
    // Get user's FCM tokens
    const userTokens = await knex('user_fcm_tokens')
      .where({ user_id, is_active: true })
      .select('token');

    if (userTokens.length === 0) {
      console.log('No FCM tokens found for user:', userId);
      return;
    }

    const tokens = userTokens.map(ut => ut.token);

    const messagePayload = {
      notification: {
        title,
        body: message,
        sound: 'default',
      },
      data: {
        ...data,
        sent_at: new Date().toISOString(),
      },
      tokens: tokens,
    };

    // Send multicast message
    const response = await admin.messaging().sendMulticast(messagePayload);

    console.log('Push notification sent:', {
      successCount: response.successCount,
      failureCount: response.failureCount,
      userId,
    });

    // Handle failed tokens (remove invalid ones)
    if (response.failureCount > 0) {
      const invalidTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error?.code === 'messaging/invalid-registration-token') {
          invalidTokens.push(tokens[idx]);
        }
      });

      if (invalidTokens.length > 0) {
        await knex('user_fcm_tokens')
          .where({ user_id })
          .whereIn('token', invalidTokens)
          .del();
      }
    }

    return response;
  } catch (error) {
    console.error('Send push notification error:', error);
    // Don't throw error - notification creation should not fail if push fails
  }
};

/**
 * Mark notifications as read
 */
const markNotificationsAsRead = async (userId, notificationIds = null) => {
  try {
    let query = knex('notifications').where({ user_id, is_read: false });

    if (notificationIds) {
      query = query.whereIn('id', Array.isArray(notificationIds) ? notificationIds : [notificationIds]);
    }

    await query.update({
      is_read: true,
      updated_at: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error('Mark notifications as read error:', error);
    throw error;
  }
};

/**
 * Get unread notification count for a user
 */
const getUnreadNotificationCount = async (userId) => {
  try {
    const result = await knex('notifications')
      .where({ user_id, is_read: false })
      .count('* as count')
      .first();

    return parseInt(result.count) || 0;
  } catch (error) {
    console.error('Get unread notification count error:', error);
    return 0;
  }
};

/**
 * Clean up old notifications (older than 30 days)
 */
const cleanupOldNotifications = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deletedCount = await knex('notifications')
      .where('created_at', '<', thirtyDaysAgo)
      .del();

    console.log(`Cleaned up ${deletedCount} old notifications`);
    return deletedCount;
  } catch (error) {
    console.error('Cleanup old notifications error:', error);
    return 0;
  }
};

/**
 * Send email notification (backup for important notifications)
 */
const sendEmailNotification = async (userId, subject, message) => {
  try {
    // This would integrate with your email service (SendGrid, Nodemailer, etc.)
    // Implementation depends on your email service choice
    console.log('Email notification would be sent to user:', userId, {
      subject,
      message,
    });

    return { success: true };
  } catch (error) {
    console.error('Send email notification error:', error);
    throw error;
  }
};

/**
 * Broadcast notification to all users
 */
const broadcastNotification = async (title, message, type = 'general', userType = null) => {
  try {
    let query = knex('users').select('id');

    if (userType) {
      query = query.where('user_type', userType);
    }

    const users = await query;

    const notifications = users.map(user => ({
      id: require('uuid').v4(),
      user_id: user.id,
      title,
      message,
      type,
      is_read: false,
      created_at: new Date(),
      updated_at: new Date(),
    }));

    if (notifications.length > 0) {
      await knex('notifications').insert(notifications);

      // Send push notifications to all users
      for (const user of users) {
        await sendPushNotification(user.id, title, message, { type });
      }
    }

    return { success: true, sent_to: notifications.length };
  } catch (error) {
    console.error('Broadcast notification error:', error);
    throw error;
  }
};

module.exports = {
  createNotification,
  sendPushNotification,
  markNotificationsAsRead,
  getUnreadNotificationCount,
  cleanupOldNotifications,
  sendEmailNotification,
  broadcastNotification,
};