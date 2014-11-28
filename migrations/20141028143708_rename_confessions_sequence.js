'use strict';

exports.up = function(knex, Promise) {
  return knex.raw('ALTER SEQUENCE confessions_id_seq RENAME TO statements_id_seq');
};

exports.down = function(knex, Promise) {
  return knex.raw('ALTER SEQUENCE statements_id_seq RENAME TO confessions_id_seq');
};
