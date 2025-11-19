const express = require('express');
const { v4: uuidv4 } = require('uuid');
const knex = require('../config/database');
const { authMiddleware, adminAuth } = require('../middleware/auth');
const { createNotification } = require('../services/notifications');

const router = express.Router();

// All admin routes require admin authentication
router.use(authMiddleware, adminAuth);

// Get admin dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalItems,
      lostItems,
      foundItems,
      claimedItems,
      pendingClaims,
      totalUsers,
      activeUsers,
    ] = await Promise.all([
      knex('items').count('* as total').first(),
      knex('items').where({ item_type: 'lost' }).count('* as total').first(),
      knex('items').where({ item_type: 'found' }).count('* as total').first(),
      knex('items').where({ status: 'claimed' }).count('* as total').first(),
      knex('claims').where({ status: 'pending' }).count('* as total').first(),
      knex('users').count('* as total').first(),
      knex('users')
        .where('created_at', '>', knex.raw('NOW() - INTERVAL \'30 days\''))
        .count('* as total')
        .first(),
    ]);

    // Get recent activity
    const recentItems = await knex('items')
      .select('items.*', 'users.full_name as reporter_name')
      .join('users', 'items.reporter_id', 'users.id')
      .orderBy('items.created_at', 'desc')
      .limit(5);

    const recentClaims = await knex('claims')
      .select([
        'claims.*',
        'items.title as item_title',
        'claimants.full_name as claimant_name',
        'reporters.full_name as reporter_name',
      ])
      .join('items', 'claims.item_id', 'items.id')
      .join('users as claimants', 'claims.claimant_id', 'claimants.id')
      .join('users as reporters', 'items.reporter_id', 'reporters.id')
      .orderBy('claims.created_at', 'desc')
      .limit(5);

    const stats = {
      total_items: parseInt(totalItems.total),
      lost_items: parseInt(lostItems.total),
      found_items: parseInt(foundItems.total),
      claimed_items: parseInt(claimedItems.total),
      pending_claims: parseInt(pendingClaims.total),
      total_users: parseInt(totalUsers.total),
      active_users: parseInt(activeUsers.total),
      recent_items,
      recent_claims,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch dashboard statistics',
      },
    });
  }
});

// Get all items with admin controls
router.get('/items', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      item_type,
      category,
      search,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = req.query;

    const offset = (page - 1) * limit;

    let query = knex('items')
      .select([
        'items.*',
        'users.full_name as reporter_name',
        'users.email as reporter_email',
        knex.raw('JSON_AGG(JSON_BUILD_OBJECT(\'photo_url\', item_photos.photo_url, \'sort_order\', item_photos.sort_order)) as photos')
      ])
      .leftJoin('users', 'items.reporter_id', 'users.id')
      .leftJoin('item_photos', 'items.id', 'item_photos.item_id')
      .groupBy('items.id', 'users.full_name', 'users.email');

    // Apply filters
    if (status && status !== 'all') {
      query = query.where('items.status', status);
    }

    if (item_type && item_type !== 'all') {
      query = query.where('items.item_type', item_type);
    }

    if (category && category !== 'all') {
      query = query.where('items.category', category);
    }

    if (search) {
      query = query.where(function() {
        this.where('items.title', 'ilike', `%${search}%`)
            .orWhere('items.description', 'ilike', `%${search}%`)
            .orWhere('items.last_location', 'ilike', `%${search}%`)
            .orWhere('users.full_name', 'ilike', `%${search}%`);
      });
    }

    // Apply sorting
    const validSortColumns = ['created_at', 'updated_at', 'title', 'status', 'category'];
    if (validSortColumns.includes(sort_by)) {
      query = query.orderBy(`items.${sort_by}`, sort_order === 'asc' ? 'asc' : 'desc');
    }

    // Get total count for pagination
    const countQuery = knex('items')
      .leftJoin('users', 'items.reporter_id', 'users.id');

    if (status && status !== 'all') countQuery.where('items.status', status);
    if (item_type && item_type !== 'all') countQuery.where('items.item_type', item_type);
    if (category && category !== 'all') countQuery.where('items.category', category);
    if (search) {
      countQuery.where(function() {
        this.where('items.title', 'ilike', `%${search}%`)
            .orWhere('items.description', 'ilike', `%${search}%`)
            .orWhere('items.last_location', 'ilike', `%${search}%`)
            .orWhere('users.full_name', 'ilike', `%${search}%`);
      });
    }

    const [items, totalItems] = await Promise.all([
      query.limit(limit).offset(offset),
      countQuery.count('* as total').first(),
    ]);

    // Format the photos array
    const formattedItems = items.map(item => ({
      ...item,
      photos: item.photos && item.photos[0]?.photo_url ? item.photos.sort((a, b) => a.sort_order - b.sort_order) : [],
    }));

    res.json({
      success: true,
      data: {
        items: formattedItems,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalItems.total / limit),
          total_items: parseInt(totalItems.total),
          items_per_page: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('Get admin items error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch items',
      },
    });
  }
});

// Remove an item (admin action)
router.delete('/items/:itemId', async (req, res) => {
  const { itemId } = req.params;
  const { reason } = req.body;

  if (!reason || reason.trim() === '') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Reason for removal is required',
      },
    });
  }

  try {
    // Get item details before deletion
    const item = await knex('items').where({ id: itemId }).first();
    if (!item) {
      return res.status(404).json({
        error: {
          code: 'DATABASE_001',
          message: 'Item not found',
        },
      });
    }

    // Delete the item (cascade will delete related records)
    await knex('items').where({ id: itemId }).del();

    // Notify the reporter
    await createNotification({
      user_id: item.reporter_id,
      title: 'Item Removed',
      message: `Your "${item.title}" item has been removed by an admin. Reason: ${reason}`,
      type: 'claim_status',
      related_item_id: itemId,
    });

    res.json({
      success: true,
      message: 'Item removed successfully',
    });
  } catch (error) {
    console.error('Remove item error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to remove item',
      },
    });
  }
});

// Get all claims for admin review
router.get('/claims', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = req.query;

    const offset = (page - 1) * limit;

    let query = knex('claims')
      .select([
        'claims.*',
        'items.title as item_title',
        'items.description as item_description',
        'items.category as item_category',
        'items.photos as item_photos',
        'claimants.full_name as claimant_name',
        'claimants.email as claimant_email',
        'reporters.full_name as reporter_name',
        'reporters.email as reporter_email',
        knex.raw('JSON_AGG(JSON_BUILD_OBJECT(\'photo_url\', item_photos.photo_url, \'sort_order\', item_photos.sort_order)) as item_photos_array')
      ])
      .join('items', 'claims.item_id', 'items.id')
      .join('users as claimants', 'claims.claimant_id', 'claimants.id')
      .join('users as reporters', 'items.reporter_id', 'reporters.id')
      .leftJoin('item_photos', 'items.id', 'item_photos.item_id')
      .groupBy('claims.id', 'items.title', 'items.description', 'items.category', 'claimants.full_name', 'claimants.email', 'reporters.full_name', 'reporters.email');

    // Apply filters
    if (status && status !== 'all') {
      query = query.where('claims.status', status);
    }

    if (search) {
      query = query.where(function() {
        this.where('items.title', 'ilike', `%${search}%`)
            .orWhere('claimants.full_name', 'ilike', `%${search}%`)
            .orWhere('reporters.full_name', 'ilike', `%${search}%`);
      });
    }

    // Apply sorting
    const validSortColumns = ['created_at', 'updated_at', 'status'];
    if (validSortColumns.includes(sort_by)) {
      query = query.orderBy(`claims.${sort_by}`, sort_order === 'asc' ? 'asc' : 'desc');
    }

    // Get total count for pagination
    const countQuery = knex('claims')
      .join('items', 'claims.item_id', 'items.id')
      .join('users as claimants', 'claims.claimant_id', 'claimants.id')
      .join('users as reporters', 'items.reporter_id', 'reporters.id');

    if (status && status !== 'all') countQuery.where('claims.status', status);
    if (search) {
      countQuery.where(function() {
        this.where('items.title', 'ilike', `%${search}%`)
            .orWhere('claimants.full_name', 'ilike', `%${search}%`)
            .orWhere('reporters.full_name', 'ilike', `%${search}%`);
      });
    }

    const [claims, totalClaims] = await Promise.all([
      query.limit(limit).offset(offset),
      countQuery.count('* as total').first(),
    ]);

    // Format the photos array
    const formattedClaims = claims.map(claim => ({
      ...claim,
      item_photos: claim.item_photos_array && claim.item_photos_array[0]?.photo_url
        ? claim.item_photos_array.sort((a, b) => a.sort_order - b.sort_order)
        : [],
    }));

    res.json({
      success: true,
      data: {
        claims: formattedClaims,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalClaims.total / limit),
          total_items: parseInt(totalClaims.total),
          items_per_page: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('Get admin claims error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch claims',
      },
    });
  }
});

// Approve a claim (admin action)
router.put('/claims/:claimId/approve', async (req, res) => {
  const { claimId } = req.params;

  try {
    // Get the claim with item details
    const claim = await knex('claims')
      .select([
        'claims.*',
        'items.title as item_title',
        'items.reporter_id',
        'items.id as item_id',
      ])
      .join('items', 'claims.item_id', 'items.id')
      .where('claims.id', claimId)
      .first();

    if (!claim) {
      return res.status(404).json({
        error: {
          code: 'DATABASE_001',
          message: 'Claim not found',
        },
      });
    }

    if (claim.status !== 'pending') {
      return res.status(400).json({
        error: {
          code: 'CLAIM_004',
          message: 'Claim has already been processed',
        },
      });
    }

    const now = new Date();

    // Update the claim
    await knex('claims')
      .where({ id: claimId })
      .update({
        status: 'approved',
        verified_at: now,
        updated_at: now,
      });

    // Update item status
    await knex('items')
      .where({ id: claim.item_id })
      .update({
        status: 'claimed',
        updated_at: now,
      });

    // Reject all other pending claims for this item
    await knex('claims')
      .where({
        item_id: claim.item_id,
        status: 'pending',
      })
      .whereNot('id', claimId)
      .update({
        status: 'rejected',
        updated_at: now,
      });

    // Notify claimant
    await createNotification({
      user_id: claim.claimant_id,
      title: 'Claim Approved!',
      message: `Your claim for "${claim.item_title}" has been approved by an admin`,
      type: 'claim_status',
      related_item_id: claim.item_id,
    });

    // Notify reporter
    await createNotification({
      user_id: claim.reporter_id,
      title: 'Claim Approved',
      message: `An admin has approved a claim for your lost item: "${claim.item_title}"`,
      type: 'claim_status',
      related_item_id: claim.item_id,
    });

    // Notify other rejected claimants
    const otherClaimants = await knex('claims')
      .select('claimant_id')
      .where({
        item_id: claim.item_id,
        status: 'rejected',
      })
      .whereNot('claimant_id', claim.claimant_id);

    for (const claimant of otherClaimants) {
      await createNotification({
        user_id: claimant.claimant_id,
        title: 'Claim Rejected',
        message: `Your claim for "${claim.item_title}" has been rejected as another claim was approved`,
        type: 'claim_status',
        related_item_id: claim.item_id,
      });
    }

    res.json({
      success: true,
      message: 'Claim approved successfully',
    });
  } catch (error) {
    console.error('Approve claim error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to approve claim',
      },
    });
  }
});

// Reject a claim (admin action)
router.put('/claims/:claimId/reject', async (req, res) => {
  const { claimId } = req.params;
  const { reason } = req.body;

  if (!reason || reason.trim() === '') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Rejection reason is required',
      },
    });
  }

  try {
    // Get the claim with item details
    const claim = await knex('claims')
      .select([
        'claims.*',
        'items.title as item_title',
        'items.reporter_id',
        'items.id as item_id',
      ])
      .join('items', 'claims.item_id', 'items.id')
      .where('claims.id', claimId)
      .first();

    if (!claim) {
      return res.status(404).json({
        error: {
          code: 'DATABASE_001',
          message: 'Claim not found',
        },
      });
    }

    if (claim.status !== 'pending') {
      return res.status(400).json({
        error: {
          code: 'CLAIM_004',
          message: 'Claim has already been processed',
        },
      });
    }

    const now = new Date();

    // Update the claim
    await knex('claims')
      .where({ id: claimId })
      .update({
        status: 'rejected',
        admin_notes: reason,
        updated_at: now,
      });

    // Check if there are other pending claims
    const otherPendingClaims = await knex('claims')
      .where({
        item_id: claim.item_id,
        status: 'pending',
      })
      .count('* as count')
      .first();

    // If no other pending claims, update item status back to unclaimed
    if (parseInt(otherPendingClaims.count) === 0) {
      await knex('items')
        .where({ id: claim.item_id })
        .update({
          status: 'unclaimed',
          updated_at: now,
        });
    }

    // Notify claimant
    await createNotification({
      user_id: claim.claimant_id,
      title: 'Claim Rejected',
      message: `Your claim for "${claim.item_title}" has been rejected. Reason: ${reason}`,
      type: 'claim_status',
      related_item_id: claim.item_id,
    });

    res.json({
      success: true,
      message: 'Claim rejected successfully',
    });
  } catch (error) {
    console.error('Reject claim error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to reject claim',
      },
    });
  }
});

// Get all users for admin management
router.get('/users', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      user_type,
      search,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = req.query;

    const offset = (page - 1) * limit;

    let query = knex('users')
      .select([
        'users.*',
        knex.raw('(SELECT COUNT(*) FROM items WHERE reporter_id = users.id) as items_count'),
        knex.raw('(SELECT COUNT(*) FROM claims WHERE claimant_id = users.id) as claims_count'),
      ]);

    // Apply filters
    if (user_type && user_type !== 'all') {
      query = query.where('users.user_type', user_type);
    }

    if (search) {
      query = query.where(function() {
        this.where('users.full_name', 'ilike', `%${search}%`)
            .orWhere('users.email', 'ilike', `%${search}%`);
      });
    }

    // Apply sorting
    const validSortColumns = ['created_at', 'full_name', 'email', 'user_type'];
    if (validSortColumns.includes(sort_by)) {
      query = query.orderBy(`users.${sort_by}`, sort_order === 'asc' ? 'asc' : 'desc');
    }

    // Get total count for pagination
    const countQuery = knex('users');

    if (user_type && user_type !== 'all') countQuery.where('users.user_type', user_type);
    if (search) {
      countQuery.where(function() {
        this.where('users.full_name', 'ilike', `%${search}%`)
            .orWhere('users.email', 'ilike', `%${search}%`);
      });
    }

    const [users, totalUsers] = await Promise.all([
      query.limit(limit).offset(offset),
      countQuery.count('* as total').first(),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalUsers.total / limit),
          total_items: parseInt(totalUsers.total),
          items_per_page: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch users',
      },
    });
  }
});

module.exports = router;