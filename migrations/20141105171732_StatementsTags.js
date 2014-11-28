'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.createTable('statements_tags', function(table) {
    table.increments('id');
    table.integer('statement_id').references('statements.id');
    table.integer('tag_id').references('tags.id');
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('statements_tags');
};
