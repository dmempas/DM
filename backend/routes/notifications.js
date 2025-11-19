const express = require('express');
const knex = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { markNotificationsAsRead, getUnreadNotificationCount } = require('../services/notifications');

const router = express.Router();

// Get notifications for the current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, unread_only = false } = req.query;
    const offset = (page - 1) * limit;

    let query = knex('notifications')
      .where('user_id', req.user.id)
      .orderBy('created_at', 'desc');

    if (unread_only === 'true') {
      query = query.where('is_read', false);
    }

    const notifications = await query.limit(limit).offset(offset);

    // Get unread count
    const unreadCount = await getUnreadNotificationCount(req.user.id);

    res.json({
      success: true,
      data: notifications,
      unread_count: unreadCount,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch notifications',
      },
    });
  }
});

// Mark notification as read
router.put('/:notificationId/read', authMiddleware, async (req, res) => {
  try {
    const { notificationId } = req.params;

    // Verify notification belongs to user
    const notification = await knex('notifications')
      .where({
        id: notificationId,
        user_id: req.user.id,
      })
      .first();

    if (!notification) {
      return res.status(404).json({
        error: {
          code: 'DATABASE_001',
          message: 'Notification not found',
        },
      });
    }

    await markNotificationsAsRead(req.user.id, [notificationId]);

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to mark notification as read',
      },
    });
  }
});

// Mark all notifications as read
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    await markNotificationsAsRead(req.user.id);

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to mark all notifications as read',
      },
    });
  }
});

// Delete notification
router.delete('/:notificationId', authMiddleware, async (req, res) => {
  try {
    const { notificationId } = req.params;

    // Verify notification belongs to user
    const notification = await knex('notifications')
      .where({
        id: notificationId,
        user_id: req.user.id,
      })
      .first();

    if (!notification) {
      return res.status(404).json({
        error: {
          code: 'DATABASE_001',
          message: 'Notification not found',
        },
      });
    }

    await knex('notifications')
      .where({
        id: notificationId,
        user_id: req.user.id,
      })
      .del();

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete notification',
      },
    });
  }
});

// Get unread notification count
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const unreadCount = await getUnreadNotificationCount(req.user.id);

    res.json({
      success: true,
      data: {
        unread_count: unreadCount,
      },
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get unread count',
      },
    });
  }
});

module.exports = router;