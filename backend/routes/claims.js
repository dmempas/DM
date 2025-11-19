const express = require('express');
const { v4: uuidv4 } = require('uuid');
const knex = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { validateClaimCreation, handleValidationErrors } = require('../middleware/validation');
const { createNotification } = require('../services/notifications');
const { checkForMatches } = require('../services/matching');

const router = express.Router();

// Create a claim for an item
router.post('/', authMiddleware, validateClaimCreation, handleValidationErrors, async (req, res) => {
  const { item_id, verification_answers, proof_photo_url } = req.body;

  try {
    // Check if item exists and is a lost item
    const item = await knex('items').where({ id: item_id, item_type: 'lost' }).first();
    if (!item) {
      return res.status(404).json({
        error: {
          code: 'DATABASE_001',
          message: 'Lost item not found',
        },
      });
    }

    // Check if item is already claimed
    if (item.status !== 'unclaimed') {
      return res.status(400).json({
        error: {
          code: 'CLAIM_001',
          message: 'Item is already claimed or pending verification',
        },
      });
    }

    // Check if user is not the reporter
    if (item.reporter_id === req.user.id) {
      return res.status(400).json({
        error: {
          code: 'CLAIM_002',
          message: 'You cannot claim your own lost item',
        },
      });
    }

    // Check if user has already claimed this item
    const existingClaim = await knex('claims')
      .where({
        item_id,
        claimant_id: req.user.id,
      })
      .first();

    if (existingClaim) {
      return res.status(400).json({
        error: {
          code: 'CLAIM_003',
          message: 'You have already claimed this item',
        },
      });
    }

    // Create the claim
    const [newClaim] = await knex('claims')
      .insert({
        id: uuidv4(),
        item_id,
        claimant_id: req.user.id,
        status: 'pending',
        verification_answers: verification_answers || {},
        proof_photo_url,
        claimed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    // Update item status to pending verification
    await knex('items')
      .where({ id: item_id })
      .update({
        status: 'pending_verification',
        updated_at: new Date(),
      });

    // Get item reporter info for notification
    const reporter = await knex('users')
      .where({ id: item.reporter_id })
      .first();

    // Create notification for the item reporter
    await createNotification({
      user_id: item.reporter_id,
      title: 'New Claim for Your Lost Item',
      message: `Someone has claimed your lost item: ${item.title}`,
      type: 'claim_status',
      related_item_id: item_id,
    });

    // Get claimant info for response
    const claimant = await knex('users')
      .where({ id: req.user.id })
      .first();

    // Get complete claim details
    const completeClaim = {
      ...newClaim,
      item: {
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        photos: await knex('item_photos')
          .where({ item_id: item.id })
          .orderBy('sort_order', 'asc'),
      },
      claimant: {
        id: claimant.id,
        full_name: claimant.full_name,
        email: claimant.email,
      },
    };

    res.status(201).json({
      success: true,
      data: completeClaim,
      message: 'Claim submitted successfully. Awaiting verification from the item reporter.',
    });
  } catch (error) {
    console.error('Create claim error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create claim',
      },
    });
  }
});

// Get all claims for the current user
router.get('/my-claims', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let query = knex('claims')
      .select([
        'claims.*',
        'items.title as item_title',
        'items.description as item_description',
        'items.category as item_category',
        'items.photos as item_photos',
        'users.full_name as reporter_name',
        knex.raw('JSON_AGG(JSON_BUILD_OBJECT(\'photo_url\', item_photos.photo_url, \'sort_order\', item_photos.sort_order)) as item_photos_array')
      ])
      .join('items', 'claims.item_id', 'items.id')
      .join('users', 'items.reporter_id', 'users.id')
      .leftJoin('item_photos', 'items.id', 'item_photos.item_id')
      .where('claims.claimant_id', req.user.id)
      .groupBy('claims.id', 'items.title', 'items.description', 'items.category', 'users.full_name');

    if (status && status !== 'all') {
      query = query.where('claims.status', status);
    }

    // Get total count
    const countQuery = knex('claims')
      .join('items', 'claims.item_id', 'items.id')
      .where('claims.claimant_id', req.user.id);

    if (status && status !== 'all') {
      countQuery.where('claims.status', status);
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
    console.error('Get my claims error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch claims',
      },
    });
  }
});

// Get verification questions for a specific item
router.get('/verification/:itemId', authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.params;

    // Check if item exists and is a lost item
    const item = await knex('items').where({ id: itemId, item_type: 'lost' }).first();
    if (!item) {
      return res.status(404).json({
        error: {
          code: 'DATABASE_001',
          message: 'Lost item not found',
        },
      });
    }

    // Check if user is not the reporter
    if (item.reporter_id === req.user.id) {
      return res.status(400).json({
        error: {
          code: 'PERMISSION_001',
          message: 'You cannot claim your own item',
        },
      });
    }

    // Get verification questions
    const questions = await knex('verification_questions')
      .where({ item_id: itemId })
      .orderBy('created_at', 'asc');

    res.json({
      success: true,
      data: {
        item: {
          id: item.id,
          title: item.title,
          description: item.description,
          category: item.category,
        },
        verification_questions: questions,
      },
    });
  } catch (error) {
    console.error('Get verification questions error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch verification questions',
      },
    });
  }
});

// Get claims for items reported by the current user (for reporters to review)
router.get('/received-claims', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let query = knex('claims')
      .select([
        'claims.*',
        'items.title as item_title',
        'items.description as item_description',
        'items.category as item_category',
        'claimants.full_name as claimant_name',
        'claimants.email as claimant_email',
        'claimants.phone as claimant_phone',
        knex.raw('JSON_AGG(JSON_BUILD_OBJECT(\'photo_url\', item_photos.photo_url, \'sort_order\', item_photos.sort_order)) as item_photos_array')
      ])
      .join('items', 'claims.item_id', 'items.id')
      .join('users as claimants', 'claims.claimant_id', 'claimants.id')
      .leftJoin('item_photos', 'items.id', 'item_photos.item_id')
      .where('items.reporter_id', req.user.id)
      .groupBy('claims.id', 'items.title', 'items.description', 'items.category', 'claimants.full_name', 'claimants.email', 'claimants.phone');

    if (status && status !== 'all') {
      query = query.where('claims.status', status);
    }

    // Get total count
    const countQuery = knex('claims')
      .join('items', 'claims.item_id', 'items.id')
      .where('items.reporter_id', req.user.id);

    if (status && status !== 'all') {
      countQuery.where('claims.status', status);
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
    console.error('Get received claims error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch received claims',
      },
    });
  }
});

// Update claim (respond to claim as reporter)
router.put('/:id/respond', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { action, admin_notes } = req.body; // action: 'approve' or 'reject'

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Action must be either approve or reject',
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
        knex.raw('ARRAY(SELECT photo_url FROM item_photos WHERE item_id = items.id ORDER BY sort_order) as item_photos')
      ])
      .join('items', 'claims.item_id', 'items.id')
      .where('claims.id', id)
      .first();

    if (!claim) {
      return res.status(404).json({
        error: {
          code: 'DATABASE_001',
          message: 'Claim not found',
        },
      });
    }

    // Check if user is the item reporter
    if (claim.reporter_id !== req.user.id) {
      return res.status(403).json({
        error: {
          code: 'PERMISSION_001',
          message: 'Only the item reporter can respond to claims',
        },
      });
    }

    // Check if claim is still pending
    if (claim.status !== 'pending') {
      return res.status(400).json({
        error: {
          code: 'CLAIM_004',
          message: 'Claim has already been processed',
        },
      });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const now = new Date();

    // Update the claim
    await knex('claims')
      .where({ id })
      .update({
        status: newStatus,
        admin_notes,
        verified_at: action === 'approve' ? now : null,
        updated_at: now,
      });

    // Update item status
    const newStatus = action === 'approve' ? 'claimed' : 'unclaimed';
    await knex('items')
      .where({ id: claim.item_id })
      .update({
        status: newStatus,
        updated_at: now,
      });

    // Create notification for claimant
    await createNotification({
      user_id: claim.claimant_id,
      title: `Claim ${action === 'approve' ? 'Approved' : 'Rejected'}`,
      message: `Your claim for "${claim.item_title}" has been ${action === 'approve' ? 'approved' : 'rejected'}`,
      type: 'claim_status',
      related_item_id: claim.item_id,
    });

    // If rejected, check for other pending claims and update item status accordingly
    if (action === 'reject') {
      const otherPendingClaims = await knex('claims')
        .where({
          item_id: claim.item_id,
          status: 'pending',
        })
        .count('* as count')
        .first();

      if (parseInt(otherPendingClaims.count) === 0) {
        await knex('items')
          .where({ id: claim.item_id })
          .update({
            status: 'unclaimed',
            updated_at: now,
          });
      }
    }

    res.json({
      success: true,
      data: {
        claim_id: id,
        status: newStatus,
        message: `Claim ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      },
    });
  } catch (error) {
    console.error('Respond to claim error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to respond to claim',
      },
    });
  }
});

module.exports = router;