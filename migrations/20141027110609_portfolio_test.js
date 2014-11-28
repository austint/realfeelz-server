'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.createTable('confessions', function(table) {
    table.increments('id');
    table.string('confession');
    table.integer('connection').references('id');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('confessions');
};
