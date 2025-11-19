const express = require('express');
const knex = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const {
  findMatchesForFoundItem,
  findMatchesForLostItem,
  getMatchesForItem,
  updateMatchStatus,
  checkForNewMatches,
} = require('../services/matching');

const router = express.Router();

// Find matches for a specific item
router.get('/find-matches/:itemId', authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.params;

    // Verify item exists
    const item = await knex('items').where({ id: itemId }).first();
    if (!item) {
      return res.status(404).json({
        error: {
          code: 'DATABASE_001',
          message: 'Item not found',
        },
      });
    }

    // Check if user owns this item (can only check matches for your own items)
    if (item.reporter_id !== req.user.id) {
      return res.status(403).json({
        error: {
          code: 'PERMISSION_001',
          message: 'Access denied',
        },
      });
    }

    const matches = await getMatchesForItem(itemId, item.item_type);

    res.json({
      success: true,
      data: matches,
    });
  } catch (error) {
    console.error('Find matches error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to find matches',
      },
    });
  }
});

// Trigger manual matching for an item (admin use)
router.post('/trigger-matching/:itemId', authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.params;

    // Verify item exists
    const item = await knex('items').where({ id: itemId }).first();
    if (!item) {
      return res.status(404).json({
        error: {
          code: 'DATABASE_001',
          message: 'Item not found',
        },
      });
    });

    let matches;
    if (item.item_type === 'found') {
      matches = await findMatchesForFoundItem(itemId);
    } else {
      matches = await findMatchesForLostItem(itemId);
    }

    res.json({
      success: true,
      data: {
        matches_found: matches.length,
        matches,
      },
    });
  } catch (error) {
    console.error('Trigger matching error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to trigger matching',
      },
    });
  }
});

// Update match status
router.put('/matches/:matchId/status', authMiddleware, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'reviewed', 'confirmed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid match status',
        },
      });
    }

    await updateMatchStatus(matchId, status, req.user.id);

    res.json({
      success: true,
      message: 'Match status updated',
    });
  } catch (error) {
    console.error('Update match status error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update match status',
      },
    });
  }
});

// Check for new matches across all items (admin/cron use)
router.post('/check-new-matches', authMiddleware, async (req, res) => {
  try {
    const result = await checkForNewMatches();

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Check new matches error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to check for new matches',
      },
    });
  }
});

// Get match statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const [
      totalMatches,
      pendingMatches,
      confirmedMatches,
      rejectedMatches,
    ] = await Promise.all([
      knex('item_matches').count('* as total').first(),
      knex('item_matches').where({ status: 'pending' }).count('* as total').first(),
      knex('item_matches').where({ status: 'confirmed' }).count('* as total').first(),
      knex('item_matches').where({ status: 'rejected' }).count('* as total').first(),
    ]);

    const stats = {
      total_matches: parseInt(totalMatches.total),
      pending_matches: parseInt(pendingMatches.total),
      confirmed_matches: parseInt(confirmedMatches.total),
      rejected_matches: parseInt(rejectedMatches.total),
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get match stats error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get match statistics',
      },
    });
  }
});

module.exports = router;