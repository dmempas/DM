exports.up = function(knex) {
  return knex.schema.createTable('verification_questions', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('item_id').notNullable().references('id').inTable('items').onDelete('CASCADE');
    table.text('question').notNullable();
    table.text('expected_answer').nullable();
    table.enum('question_type', ['text', 'photo', 'multiple_choice']).notNullable().defaultTo('text');
    table.timestamps(true, true);

    // Indexes
    table.index('item_id');
    table.index('question_type');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('verification_questions');
};