exports.up = function(knex) {
  return knex.schema.createTable('items', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('reporter_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enum('item_type', ['lost', 'found']).notNullable();
    table.string('title', 255).notNullable();
    table.text('description').notNullable();
    table.enum('category', ['gadgets', 'school_supplies', 'ids', 'wallets', 'clothes', 'other']).notNullable();
    table.string('last_location', 255).nullable();
    table.decimal('latitude', 10, 8).nullable();
    table.decimal('longitude', 11, 8).nullable();
    table.timestamp('date_time_lost_found').notNullable().defaultTo(knex.fn.now());
    table.enum('status', ['unclaimed', 'claimed', 'pending_verification', 'verified']).notNullable().defaultTo('unclaimed');
    table.timestamps(true, true);

    // Indexes for performance
    table.index('reporter_id');
    table.index('item_type');
    table.index('category');
    table.index('status');
    table.index('created_at');
    table.index(['latitude', 'longitude']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('items');
};