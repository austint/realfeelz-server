'use strict';

process.env.NODE_ENV = 'test';

var chai = require('chai');
var expect = chai.expect;
var util = require('util');
var app = require('../server');
var path = require('path');
var BPromise = require('bluebird');
var request = BPromise.promisifyAll(require('request'));
var _ = require('lodash');

chai.use(require('sinon-chai'));

GLOBAL.__fixture = function(name) {
	var _ = require('lodash');
	var path = require('path');
	return _.cloneDeep(require(path.join(__dirname, 'fixtures', name)));
};

GLOBAL.__app = function(fn) {
	var server;
	var port = 56789;
	var baseURL = util.format('http://localhost:%d', port);

	return function() {

		before(function(done) {
			server = app.listen(port, done);
		});

		after(function(done) {
			server.close(done);
		});

		before(function() {
			this.server = server;
			this.port = port;
			this.baseURL = baseURL;
			this.app = app;

			/**
			 * It tests the api call given a particular REST noun/VERB combo.
			 *
			 * @function testAPI
			 * @param  {String} fixturePath - The partial path (noun/VERB) to the api
			 * request JSON fixture.
			 * @param {Object} [options] - Options
	     * @param {String} [options.order] - A way to order the response JSON data.
     	 * The initial part of the string is expected to be a key through which to
       * access data to sort & the final part of the string is the key to use to
       * sort. Example: `users.id` would access `users` in the response data &
       * sort it by `id`.
			 * @return {Promise} A promise. ;)
			 */
			this.testAPI = function(fixturePath, options) {
				var opts = options || {};
				var fixture = __fixture(path.join('http', fixturePath));
				var method = fixture.request.method.toLowerCase();
				var asyncMethodName = method + 'Async';
				var url = baseURL + fixture.request.url;
				var data = { json: fixture.request.bodyJSON };

				return request[asyncMethodName](url, data)
				.spread(function(response, body) {
					if (opts.order) {
	          var keys = opts.order.split('.');
	          var objectKey = keys[0];
	          var sortKey = keys[1];
	          body[objectKey] = _.sortBy(body[objectKey], sortKey);
        	}
					expect(body).to.eql(fixture.response.bodyJSON,
						'response body does not match fixture');
				});
			};

			/**
			 * It tests the database for the return of the given data.
			 *
			 * @function testDB
			 * @param  {String} fixturePath - The partial path (noun/VERB) to the api
			 * request JSON fixture.
			 * @param  {Array} key - The fixture data for testing the database.
			 * @param  {Object} model - A Bookshelf model.
			 * @return {Promise} A promise.
			 */
			this.testDB = function(fixturePath, key, model) {
				var fixture = __fixture(path.join('http', fixturePath));
				var collection = new model().query(function(qb){
					qb.orderBy('id', 'ASC');
				});
				return collection.fetchAll().then(function(objects) {
					// jsonify becuase db could store & retrieve objects that aren't
					// supported in json (i.e. date). we're basically forcing the db
					// contents to look more like a json file.
					var jsonified = JSON.parse(JSON.stringify(objects));
					expect(jsonified).to.eql(fixture[key], 'db content does not match fixture');
				});
			};

			this.setupDB = function(fixturePath, key, model) {
				var fixture = __fixture(path.join('http', fixturePath));
				var models = fixture[key];

				return BPromise.map(models, function(data) {
					return model.forge().save(data, { method: 'insert' });
				});
			};
		});

		fn.apply(this, arguments);
	};
};
