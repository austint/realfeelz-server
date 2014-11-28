'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.table('statements', function(table) {
    table.dropColumn('connection');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('statements', function (table) {
    table.integer('connection').references('statements.id');
  });
};
