const knex = require('../config/database');
const { createNotification } = require('./notifications');

/**
 * Calculate similarity between two text descriptions
 */
const calculateTextSimilarity = (text1, text2) => {
  if (!text1 || !text2) return 0;

  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);

  const intersection = words1.filter(word => words2.includes(word));
  const union = [...new Set([...words1, ...words2])];

  const similarity = intersection.length / union.length;
  return similarity;
};

/**
 * Calculate distance between two coordinates in meters
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;

  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
};

/**
 * Calculate time window similarity (items within 7 days get higher score)
 */
const calculateTimeSimilarity = (date1, date2) => {
  if (!date1 || !date2) return 0;

  const timeDiff = Math.abs(new Date(date1) - new Date(date2));
  const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

  if (daysDiff <= 7) {
    return 1 - (daysDiff / 14); // Score decreases as time difference increases
  }

  return 0;
};

/**
 * Calculate matching score between lost and found items
 */
const calculateMatchScore = (lostItem, foundItem) => {
  let score = 0;
  let weights = {
    category: 0.4,
    description: 0.35,
    location: 0.2,
    time: 0.05,
  };

  // Category match (40% weight)
  if (lostItem.category === foundItem.category) {
    score += weights.category;
  }

  // Description similarity (35% weight)
  const textSimilarity = calculateTextSimilarity(
    lostItem.description,
    foundItem.description
  );
  score += textSimilarity * weights.description;

  // Location proximity (20% weight) - within 50 meters gets full score
  const distance = calculateDistance(
    lostItem.latitude,
    lostItem.longitude,
    foundItem.latitude,
    foundItem.longitude
  );

  if (distance <= 50) {
    score += weights.location;
  } else if (distance <= 200) {
    score += weights.location * 0.5;
  } else if (distance <= 500) {
    score += weights.location * 0.25;
  }

  // Time window (5% weight) - within 7 days gets higher score
  const timeSimilarity = calculateTimeSimilarity(
    lostItem.date_time_lost_found,
    foundItem.date_time_lost_found
  );
  score += timeSimilarity * weights.time;

  return score;
};

/**
 * Find potential matches for a newly reported found item
 */
const findMatchesForFoundItem = async (foundItemId) => {
  try {
    // Get the found item
    const foundItem = await knex('items').where({ id: foundItemId, item_type: 'found' }).first();
    if (!foundItem) {
      throw new Error('Found item not found');
    }

    // Get all unclaimed lost items of the same category
    const potentialMatches = await knex('items')
      .where({
        item_type: 'lost',
        category: foundItem.category,
        status: 'unclaimed',
      })
      .whereNot('id', foundItemId)
      .orderBy('created_at', 'desc');

    const matches = [];

    for (const lostItem of potentialMatches) {
      const score = calculateMatchScore(lostItem, foundItem);

      if (score >= 0.7) { // 70% threshold
        matches.push({
          lost_item_id: lostItem.id,
          found_item_id: foundItemId,
          match_score: score,
          lost_item: lostItem,
          found_item: foundItem,
        });
      }
    }

    // Sort by match score (highest first)
    matches.sort((a, b) => b.match_score - a.match_score);

    // Save matches to database and send notifications
    for (const match of matches) {
      await saveMatchAndNotify(match);
    }

    return matches;
  } catch (error) {
    console.error('Find matches for found item error:', error);
    throw error;
  }
};

/**
 * Find potential matches for a newly reported lost item
 */
const findMatchesForLostItem = async (lostItemId) => {
  try {
    // Get the lost item
    const lostItem = await knex('items').where({ id: lostItemId, item_type: 'lost' }).first();
    if (!lostItem) {
      throw new Error('Lost item not found');
    }

    // Get all unclaimed found items of the same category
    const potentialMatches = await knex('items')
      .where({
        item_type: 'found',
        category: lostItem.category,
        status: 'unclaimed',
      })
      .whereNot('id', lostItemId)
      .orderBy('created_at', 'desc');

    const matches = [];

    for (const foundItem of potentialMatches) {
      const score = calculateMatchScore(lostItem, foundItem);

      if (score >= 0.7) { // 70% threshold
        matches.push({
          lost_item_id: lostItemId,
          found_item_id: foundItem.id,
          match_score: score,
          lost_item: lostItem,
          found_item: foundItem,
        });
      }
    }

    // Sort by match score (highest first)
    matches.sort((a, b) => b.match_score - a.match_score);

    // Save matches to database and send notifications
    for (const match of matches) {
      await saveMatchAndNotify(match);
    }

    return matches;
  } catch (error) {
    console.error('Find matches for lost item error:', error);
    throw error;
  }
};

/**
 * Save match to database and send notifications
 */
const saveMatchAndNotify = async (match) => {
  try {
    const matchId = require('uuid').v4();

    // Save match to database (you might want to create a matches table)
    await knex('item_matches').insert({
      id: matchId,
      lost_item_id: match.lost_item_id,
      found_item_id: match.found_item_id,
      match_score: match.match_score,
      status: 'pending', // pending, reviewed, confirmed, rejected
      created_at: new Date(),
      updated_at: new Date(),
    }).onConflict().ignore(); // Avoid duplicate matches

    // Notify the lost item reporter
    await createNotification({
      user_id: match.lost_item.reporter_id,
      title: 'Potential Match Found!',
      message: `We found a ${match.found_item.category} that might match your lost item: "${match.lost_item.title}"`,
      type: 'match_found',
      related_item_id: match.lost_item.id,
    });

    // Notify the found item reporter
    await createNotification({
      user_id: match.found_item.reporter_id,
      title: 'Potential Match Found!',
      message: `Your found ${match.found_item.category} might match this lost item: "${match.found_item.title}"`,
      type: 'match_found',
      related_item_id: match.found_item.id,
    });

    return matchId;
  } catch (error) {
    console.error('Save match and notify error:', error);
    throw error;
  }
};

/**
 * Get matches for a specific item
 */
const getMatchesForItem = async (itemId, itemType) => {
  try {
    let query;

    if (itemType === 'lost') {
      query = knex('item_matches')
        .select([
          'item_matches.*',
          'items.title as matched_item_title',
          'items.description as matched_item_description',
          'items.category as matched_item_category',
          'users.full_name as matched_item_reporter_name',
          knex.raw('ARRAY(SELECT photo_url FROM item_photos WHERE item_id = items.id ORDER BY sort_order) as matched_item_photos')
        ])
        .join('items', 'item_matches.found_item_id', 'items.id')
        .join('users', 'items.reporter_id', 'users.id')
        .where('item_matches.lost_item_id', itemId);
    } else {
      query = knex('item_matches')
        .select([
          'item_matches.*',
          'items.title as matched_item_title',
          'items.description as matched_item_description',
          'items.category as matched_item_category',
          'users.full_name as matched_item_reporter_name',
          knex.raw('ARRAY(SELECT photo_url FROM item_photos WHERE item_id = items.id ORDER BY sort_order) as matched_item_photos')
        ])
        .join('items', 'item_matches.lost_item_id', 'items.id')
        .join('users', 'items.reporter_id', 'users.id')
        .where('item_matches.found_item_id', itemId);
    }

    const matches = await query.orderBy('item_matches.match_score', 'desc');

    return matches;
  } catch (error) {
    console.error('Get matches for item error:', error);
    throw error;
  }
};

/**
 * Update match status
 */
const updateMatchStatus = async (matchId, status, userId) => {
  try {
    await knex('item_matches')
      .where({ id: matchId })
      .update({
        status,
        updated_by: userId,
        updated_at: new Date(),
      });

    return { success: true };
  } catch (error) {
    console.error('Update match status error:', error);
    throw error;
  }
};

/**
 * Check for new matches (can be run periodically)
 */
const checkForNewMatches = async () => {
  try {
    // Get all unclaimed items
    const unclaimedItems = await knex('items')
      .where({ status: 'unclaimed' })
      .orderBy('created_at', 'desc');

    let totalMatches = 0;

    for (const item of unclaimedItems) {
      if (item.item_type === 'found') {
        const matches = await findMatchesForFoundItem(item.id);
        totalMatches += matches.length;
      }
    }

    return { totalMatches };
  } catch (error) {
    console.error('Check for new matches error:', error);
    throw error;
  }
};

module.exports = {
  calculateMatchScore,
  findMatchesForFoundItem,
  findMatchesForLostItem,
  getMatchesForItem,
  updateMatchStatus,
  checkForNewMatches,
};