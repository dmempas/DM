exports.up = function(knex) {
  return knex.schema.createTable('item_photos', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('item_id').notNullable().references('id').inTable('items').onDelete('CASCADE');
    table.text('photo_url').notNullable();
    table.integer('sort_order').notNullable().defaultTo(0);
    table.timestamps(true, true);

    // Indexes
    table.index('item_id');
    table.index('sort_order');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('item_photos');
};