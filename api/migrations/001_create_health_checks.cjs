exports.up = async function up(knex) {
  await knex.schema.createTable('health_checks', (table) => {
    table.increments('id').primary();
    table.string('status').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('health_checks');
};
