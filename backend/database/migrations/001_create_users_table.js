exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('full_name', 255).notNullable();
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('phone', 20).nullable();
    table.text('profile_photo_url').nullable();
    table.enum('user_type', ['student', 'admin', 'staff']).notNullable().defaultTo('student');
    table.timestamps(true, true);

    // Indexes
    table.index('email');
    table.index('user_type');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};