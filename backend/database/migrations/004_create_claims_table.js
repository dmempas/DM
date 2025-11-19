exports.up = function(knex) {
  return knex.schema.createTable('claims', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('item_id').notNullable().references('id').inTable('items').onDelete('CASCADE');
    table.uuid('claimant_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enum('status', ['pending', 'approved', 'rejected']).notNullable().defaultTo('pending');
    table.jsonb('verification_answers').nullable();
    table.text('proof_photo_url').nullable();
    table.text('admin_notes').nullable();
    table.timestamp('claimed_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('verified_at').nullable();
    table.timestamps(true, true);

    // Indexes
    table.index('item_id');
    table.index('claimant_id');
    table.index('status');
    table.index('claimed_at');

    // Unique constraint: one claim per item per user
    table.unique(['item_id', 'claimant_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('claims');
};