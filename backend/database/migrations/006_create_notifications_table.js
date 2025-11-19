exports.up = function(knex) {
  return knex.schema.createTable('notifications', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('title', 255).notNullable();
    table.text('message').notNullable();
    table.enum('type', ['match_found', 'claim_status', 'verification_required']).notNullable();
    table.uuid('related_item_id').nullable().references('id').inTable('items').onDelete('SET NULL');
    table.boolean('is_read').notNullable().defaultTo(false);
    table.timestamps(true, true);

    // Indexes
    table.index('user_id');
    table.index('type');
    table.index('is_read');
    table.index('created_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('notifications');
};