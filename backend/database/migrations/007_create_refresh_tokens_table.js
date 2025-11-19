exports.up = function(knex) {
  return knex.schema.createTable('refresh_tokens', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('token', 512).notNullable().unique();
    table.timestamp('expires_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.boolean('is_revoked').notNullable().defaultTo(false);
    table.timestamp('revoked_at').nullable();

    // Indexes
    table.index('user_id');
    table.index('token');
    table.index('expires_at');
    table.index('is_revoked');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('refresh_tokens');
};