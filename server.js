'use strict';

var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var cors = require('cors');
var BPromise = require('bluebird');
var request = BPromise.promisifyAll(require('request'));
var _ = require('lodash');

var app = express();
var resources = express();

var env = process.env.NODE_ENV || 'development';
var port = process.env.PORT || 3000;

var knexConfig = require('./knexfile.js')[env];
var knex = require('knex')(knexConfig);
var bookshelf = require('bookshelf')(knex);

var Statement = bookshelf.Model.extend({
  tableName: 'statements'
});

var Tag = bookshelf.Model.extend({
  tableName: 'tags'
});

var StatementTag = bookshelf.Model.extend({
  tableName: 'statements_tags'
});

app.set('knex', knex);
app.set('bookshelf', bookshelf);
app.set('Statement', Statement);
app.set('Tag', Tag);
app.set('StatementTag', StatementTag);

app.use(bodyParser.json());

// Custom middleware: log incoming requests
app.use(function(req, res, next) {
  console.log('%s %s', req.method, req.url);
  next();
});

// CORS middleware: allow x-origin resource sharing with realfeelz-ui
app.use(cors());

// api routes
var api = express.Router();
api.get('/example', function(req, res) {
  res.json({});
});

api.post('/statements', function(req, res) {
  // how do we create StatementTag things?

  // if there is a # in the req.body.statement
  var statement = _.pick(req.body.statement, 'body');
  statement.timeAdded = new Date().toISOString();

  var body = statement.body;
  var tagNames = body.match(/#\w+/g) || [];
  var response = {};

  Statement.forge(statement).save().then(function(statement) {
    response.statement = statement.toJSON();
  })
  .then(function() { return tagNames; }) // start working with tag names
  .map(function(tagName) { // map the tags & create a new tag one at a time
    return Tag.forge({ tag: tagName }).save();
  }, { concurrency: 1 }) // concurrency of 1 is kind of just to make tests work
  .then(function(tags) {
    // tags are a bunch of bookshelf Tag instances that we just forged

    if (tags.length) {
      response.tags = tags;
    }
    return tags;
  })
  .map(function(tag) {
    var statement_id = response.statement.id;
    var tag_id = tag.id;
    return StatementTag.forge({
      statement_id: statement_id,
      tag_id: tag_id
    }).save();
  }, { concurrency: 1 })
  .then(function() {
    res.json(response);
  });
});

api.get('/statements', function(req, res) {
  Statement.query(function(queryBuilder) {
    queryBuilder.orderBy('timeAdded', 'desc');
  })
  .fetchAll()
  .then(function(statements) {
    var parsedStatements = statements.toJSON();
    res.json({ statements: parsedStatements });
  });
});

api.get('/tags', function(req, res) {
  Tag.fetchAll().then(function(tags) {
    res.json({ tags: tags.toJSON() });
    console.log(res.json);
  });
});

api.post('/captcha/verify', function(req, res) {
  var privatekey = '6LeKIP8SAAAAAOMzdHECYJ9cbUZ7nkmenoWHbnfw';
  var remoteip = req.connection.remoteAddress;
  var recaptchaAPIEndpoint;

  if (env === 'test') {
    recaptchaAPIEndpoint = 'http://localhost:3333/api';
  } else {
    recaptchaAPIEndpoint = 'http://www.google.com/recaptcha/api/verify';
  };

  req.body.privatekey = privatekey;
  req.body.remoteip = remoteip;

  request.postAsync(recaptchaAPIEndpoint, { form: req.body })
  .spread(function(response, body) {
    var success = body.split('\n')[0] === 'true';
    var responseJSON;

    if (success) {
      responseJSON = {
        result: {
          verified: true
        }
      };
    } else {
      responseJSON = {
        result: {
          verified: false
        }
      };
    }
    res.send(responseJSON);
  });
});

// single-page app routes
app.use('/api', api);
app.get('/*', function(req, res, next) {
  req.url = '/index.html';
  next();
}, resources);

// expose app
module.exports = app;

// start server
app.listen(port, function() {
  return console.log('Express server listening on port %d. Environment: %s.', port, app.get('env'));
});
