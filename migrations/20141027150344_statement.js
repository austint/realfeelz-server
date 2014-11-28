'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.renameTable('confessions', 'statements')
    .table('statements', function(table) {
      table.renameColumn('confession', 'body');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema.renameTable('statements', 'confessions')
    .table('confessions', function(table) {
      table.renameColumn('body', 'confession');
    });
};
