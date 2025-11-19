const express = require('express');
const { v4: uuidv4 } = require('uuid');
const knex = require('../config/database');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const { validateItemCreation, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Get all items with filtering and pagination
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      item_type,
      status = 'unclaimed',
      search,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = req.query;

    const offset = (page - 1) * limit;
    let query = knex('items')
      .select([
        'items.*',
        'users.full_name as reporter_name',
        knex.raw('JSON_AGG(JSON_BUILD_OBJECT(\'photo_url\', item_photos.photo_url, \'sort_order\', item_photos.sort_order)) as photos')
      ])
      .leftJoin('users', 'items.reporter_id', 'users.id')
      .leftJoin('item_photos', 'items.id', 'item_photos.item_id')
      .groupBy('items.id', 'users.full_name');

    // Apply filters
    if (category) {
      query = query.where('items.category', category);
    }

    if (item_type) {
      query = query.where('items.item_type', item_type);
    }

    if (status && status !== 'all') {
      query = query.where('items.status', status);
    }

    if (search) {
      query = query.where(function() {
        this.where('items.title', 'ilike', `%${search}%`)
            .orWhere('items.description', 'ilike', `%${search}%`)
            .orWhere('items.last_location', 'ilike', `%${search}%`);
      });
    }

    // Apply sorting
    if (sort_by === 'created_at' || sort_by === 'date_time_lost_found') {
      query = query.orderBy(`items.${sort_by}`, sort_order === 'asc' ? 'asc' : 'desc');
    }

    // Get total count for pagination
    const countQuery = knex('items');
    if (category) countQuery.where('category', category);
    if (item_type) countQuery.where('item_type', item_type);
    if (status && status !== 'all') countQuery.where('status', status);
    if (search) {
      countQuery.where(function() {
        this.where('title', 'ilike', `%${search}%`)
            .orWhere('description', 'ilike', `%${search}%`)
            .orWhere('last_location', 'ilike', `%${search}%`);
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
    console.error('Get items error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch items',
      },
    });
  }
});

// Get single item with details
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const item = await knex('items')
      .select([
        'items.*',
        'users.full_name as reporter_name',
        'users.email as reporter_email',
        knex.raw('JSON_AGG(JSON_BUILD_OBJECT(\'photo_url\', item_photos.photo_url, \'sort_order\', item_photos.sort_order)) as photos')
      ])
      .leftJoin('users', 'items.reporter_id', 'users.id')
      .leftJoin('item_photos', 'items.id', 'item_photos.item_id')
      .where('items.id', id)
      .groupBy('items.id', 'users.full_name', 'users.email')
      .first();

    if (!item) {
      return res.status(404).json({
        error: {
          code: 'DATABASE_001',
          message: 'Item not found',
        },
      });
    }

    // Get verification questions if user is authenticated
    let verificationQuestions = [];
    if (req.user && item.item_type === 'lost') {
      verificationQuestions = await knex('verification_questions')
        .where({ item_id: id })
        .orderBy('created_at', 'asc');
    }

    // Check if current user has already claimed this item
    let userClaim = null;
    if (req.user) {
      userClaim = await knex('claims')
        .where({
          item_id: id,
          claimant_id: req.user.id,
        })
        .first();
    }

    // Format the photos array
    const formattedItem = {
      ...item,
      photos: item.photos && item.photos[0]?.photo_url ? item.photos.sort((a, b) => a.sort_order - b.sort_order) : [],
      verification_questions: verificationQuestions,
      user_claim: userClaim,
    };

    res.json({
      success: true,
      data: formattedItem,
    });
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch item',
      },
    });
  }
});

// Create new item
router.post('/', authMiddleware, validateItemCreation, handleValidationErrors, async (req, res) => {
  const {
    title,
    description,
    item_type,
    category,
    last_location,
    latitude,
    longitude,
    date_time_lost_found,
    verification_questions,
    photos,
  } = req.body;

  try {
    const itemId = uuidv4();

    // Create the item
    const [newItem] = await knex('items')
      .insert({
        id: itemId,
        reporter_id: req.user.id,
        item_type,
        title,
        description,
        category,
        last_location,
        latitude,
        longitude,
        date_time_lost_found: date_time_lost_found ? new Date(date_time_lost_found) : new Date(),
        status: 'unclaimed',
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    // Add photos if provided
    if (photos && photos.length > 0) {
      const photoData = photos.map((photo, index) => ({
        id: uuidv4(),
        item_id: itemId,
        photo_url: photo.photo_url,
        sort_order: index,
        created_at: new Date(),
      }));

      await knex('item_photos').insert(photoData);
    }

    // Add verification questions for lost items
    if (item_type === 'lost' && verification_questions && verification_questions.length > 0) {
      const questionData = verification_questions.map(question => ({
        id: uuidv4(),
        item_id: itemId,
        question: question.question,
        expected_answer: question.expected_answer,
        question_type: question.question_type || 'text',
        created_at: new Date(),
      }));

      await knex('verification_questions').insert(questionData);
    }

    // Get complete item with photos
    const completeItem = await knex('items')
      .select([
        'items.*',
        'users.full_name as reporter_name',
        knex.raw('JSON_AGG(JSON_BUILD_OBJECT(\'photo_url\', item_photos.photo_url, \'sort_order\', item_photos.sort_order)) as photos')
      ])
      .leftJoin('users', 'items.reporter_id', 'users.id')
      .leftJoin('item_photos', 'items.id', 'item_photos.item_id')
      .where('items.id', itemId)
      .groupBy('items.id', 'users.full_name')
      .first();

    // Format photos
    const formattedItem = {
      ...completeItem,
      photos: completeItem.photos && completeItem.photos[0]?.photo_url ? completeItem.photos.sort((a, b) => a.sort_order - b.sort_order) : [],
    };

    // Trigger matching for found items
    if (item_type === 'found') {
      // This would trigger the matching algorithm
      // For now, we'll implement this in the matching service
    }

    res.status(201).json({
      success: true,
      data: formattedItem,
    });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create item',
      },
    });
  }
});

// Update item (only by reporter or admin)
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    // Get the item
    const item = await knex('items').where({ id }).first();
    if (!item) {
      return res.status(404).json({
        error: {
          code: 'DATABASE_001',
          message: 'Item not found',
        },
      });
    }

    // Check if user is the reporter or admin
    if (item.reporter_id !== req.user.id && !['admin', 'staff'].includes(req.user.user_type)) {
      return res.status(403).json({
        error: {
          code: 'PERMISSION_001',
          message: 'Access denied',
        },
      });
    }

    // Don't allow updating certain fields
    delete updates.reporter_id;
    delete updates.created_at;
    delete updates.id;

    updates.updated_at = new Date();

    // Update the item
    const [updatedItem] = await knex('items')
      .where({ id })
      .update(updates)
      .returning('*');

    res.json({
      success: true,
      data: updatedItem,
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update item',
      },
    });
  }
});

// Delete item (only by reporter or admin)
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    // Get the item
    const item = await knex('items').where({ id }).first();
    if (!item) {
      return res.status(404).json({
        error: {
          code: 'DATABASE_001',
          message: 'Item not found',
        },
      });
    }

    // Check if user is the reporter or admin
    if (item.reporter_id !== req.user.id && !['admin', 'staff'].includes(req.user.user_type)) {
      return res.status(403).json({
        error: {
          code: 'PERMISSION_001',
          message: 'Access denied',
        },
      });
    }

    // Delete the item (cascade will delete related records)
    await knex('items').where({ id }).del();

    res.json({
      success: true,
      message: 'Item deleted successfully',
    });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete item',
      },
    });
  }
});

module.exports = router;