'use strict';

// NODE_ENV=test ./node_modules/.bin/knex migrate:latest

var express = require('express');
var app = require('../server');
var knex = app.get('knex');

var BPromise = require('bluebird');
var Statement = app.get('Statement');
var Tag = app.get('Tag');
var StatementTag = app.get('StatementTag');
var tk = require('timekeeper');
var time = new Date(1415397594052);

require('bluebird').longStackTraces();

describe('The app API.', __app(function() {
	beforeEach(function(done) {
		knex('statements_tags').delete()
    .then(function() {
      return knex('tags').delete();
    })
    .then(function() {
      return knex('statements').delete();
    })
    .then(function() {
			return knex.raw('alter sequence statements_id_seq restart');
		})
    .then(function() {
      return knex.raw('alter sequence tags_id_seq restart');
    })
    .then(function() {
      return knex.raw('alter sequence statements_tags_id_seq restart');
    })
    .then(function() {
      tk.freeze(time);
    })
    .then(function() { done(); }, done);
	});

  afterEach(function(done) {
    tk.reset();
    done();
  });

	it('handles POST /api/statements', function(done) {
		this.testAPI('statements/post').bind(this)
		.then(function() {
			return this.testDB('statements/post', 'database.statements', Statement);
    })
		.done(done, done);
	});

	it('handles GET /api/statements', function(done) {
		this.setupDB('statements/get', 'database.statements', Statement).bind(this)
		.then(function() {
			return this.testAPI('statements/get');
		})
		.done(done, done);
	});

  it('handles POST /api/statements with tags', function(done) {
    // TODO: things to discuss once this first test is passing:
    //   - we must test when there are multiple tags in a statement.
    //   - what happens when a tag with the same name already exists?
    //   - what are the database constraints for tags?

    // TODO: these won't use the same fixture
    var fixtureName = 'statements/post-with-tag';
    BPromise.resolve().bind(this)
    .then(function() {
      return this.testAPI(fixtureName);
    })
    .then(function() {
      return this.testDB(fixtureName, 'database.statements', Statement);
    })
    .then(function() {
      return this.testDB(fixtureName, 'database.tags', Tag);
    })
    .then(function() {
      return this.testDB(fixtureName, 'database.statementsTags', StatementTag);
    })
    .done(done, done);
  });

  it('handles GET /api/tags', function(done) {
    this.setupDB('tags/get-tag', 'database.tags', Tag).bind(this)
    .then(function() {
      return this.testAPI('tags/get-tag');
    })
    .done(done, done);
  });

  it.skip('handles POST /api/statements with duplicate tags', function(done) {
    // user submits statement with tag that is already in database
    // statement post response:
    // statement id, body, time and tag id, tag
    // stored in database: statement id, body, time
    // tag and tag id not added to tag table
    // id, statement id, and tag id added to statement_it table
    // TODO: discuss done!
    var fixtureName = 'statements/post-duplicate-tags';
    BPromise.bind(this)
    .then(function() {
      return this.setupDB(fixtureName,
        'database.statements-existing', Statement);
    })
    .then(function() {
      return this.setupDB(fixtureName,
        'database.tags-existing', Tag);
    })
     .then(function() {
       return this.setupDB(fixtureName,
         'database.statementsTags-existing', StatementTag);
     })
    .then(function() {
      return this.testAPI(fixtureName);
    })
    .then(function() {
      return this.testDB(fixtureName, 'database.statements', Statement);
    })
    .then(function() {
      return this.testDB(fixtureName, 'database.statementsTags', StatementTag);
    })
    .then(done)
    .catch(done);
  });

	describe('Captcha verification', function() {
		var captchaApp = express();
		var captchaServer;

		captchaApp.post('/api', function(req, res) {
			res.send('true\nsuccess');
		});

		beforeEach(function(done) {
			captchaServer = captchaApp.listen(3333, done);
		});

		afterEach(function(done) {
			captchaServer.close(done);
		});

		it('handles POST /api/captcha/verify', function(done) {
			this.testAPI('captcha/post-verified')
			.done(done, done);
		});
		// TODO: Add test for when Captcha fails.
	});
}));
