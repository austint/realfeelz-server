'use strict';

exports.up = function(knex, Promise) {
  // first migration was missing the confessions.id within the `references`
  // call, so here we need to drop the old column & create a new one (knex
  // doesn't have something that just allows us to add the constraint). the
  // down method gets us back to where we started. ugh.
  return knex.schema.table('confessions', function (table) {
    table.dropColumn('connection');
  }).table('confessions', function (table) {
    table.integer('connection').references('confessions.id');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('confessions', function (table) {
    table.dropColumn('connection');
  }).table('confessions', function (table) {
    table.integer('connection');
  });
};
