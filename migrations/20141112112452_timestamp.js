'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.table('statements', function(table) {
    table.timestamp('timeAdded').defaultTo(knex.raw('now()'));
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('statements', function(table) {
    table.dropColumn('timeAdded');
  });
};
