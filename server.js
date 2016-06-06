//  OpenShift sample Node application
var express = require('express');
var fs = require('fs');
var http = require('http');
var bodyParser = require('body-parser');
var mysql = require("mysql");
var http = require('http');
var CronJob = require('cron').CronJob;

/**
 *  Define the sample application.
 */
var SampleApp = function () {

	//  Scope.
	var self = this;

	/*  ================================================================  */
	/*  Helper functions.                                                 */
	/*  ================================================================  */

	/**
	 *  Set up server IP address and port # using env variables/defaults.
	 */
	self.setupVariables = function () {
		//  Set the environment variables we need.
		self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
		self.port = process.env.OPENSHIFT_NODEJS_PORT || 8080;

		if (typeof self.ipaddress === "undefined") {
			//  Log errors on OpenShift but continue w/ 127.0.0.1 - this
			//  allows us to run/test the app locally.
			console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
			self.ipaddress = "127.0.0.1";
		};
	};

	/**
	 *  Populate the cache.
	 */
	self.populateCache = function () {
		if (typeof self.zcache === "undefined") {
			self.zcache = {
				'index.html' : ''
			};
		}

		//  Local cache for static content.
		self.zcache['index.html'] = fs.readFileSync('./index.html');
	};

	/**
	 *  Retrieve entry (content) from cache.
	 *  @param {string} key  Key identifying content to retrieve from cache.
	 */
	self.cache_get = function (key) {
		return self.zcache[key];
	};

	/**
	 *  terminator === the termination handler
	 *  Terminate server on receipt of the specified signal.
	 *  @param {string} sig  Signal to terminate on.
	 */
	self.terminator = function (sig) {
		if (typeof sig === "string") {
			console.log('%s: Received %s - terminating sample app ...',
				Date(Date.now()), sig);
			process.exit(1);
		}
		console.log('%s: Node server stopped.', Date(Date.now()));
	};

	/**
	 *  Setup termination handlers (for exit and a list of signals).
	 */
	self.setupTerminationHandlers = function () {
		//  Process on exit and signals.
		process.on('exit', function () {
			self.terminator();
		});

		// Removed 'SIGPIPE' from the list - bugz 852598.
		['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
			'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
		].forEach(function (element, index, array) {
			process.on(element, function () {
				self.terminator(element);
			});
		});
	};

	/*  ================================================================  */
	/*  App server functions (main app logic here).                       */
	/*  ================================================================  */

	/**
	 *  Create the routing table entries + handlers for the application.
	 */
	self.createRoutes = function () {
		self.routes = {};

		self.routes['/'] = {
			get : function (req, res) {
				res.redirect("/arrow/arrow.html")
			}
		};
		self.routes['/index.html'] = {
			get : function (req, res) {
				res.setHeader('Content-Type', 'text/html');
				res.send(self.cache_get('index.html'));
			}
		};
	 
		self.routes['/api'] = {
			get : function (req, res) {
				res.setHeader('Content-Type', 'text/html');
				res.send(self.cache_get('index.html'));
			}
		};
		
		self.routes['/api/store/:id*?'] = {
			get : function (req, res) {
				var query = "select * from store",
				search = req.query['q'],
				page = req.query['page'],
				limit = req.query['limit'] || 10,
				param = req.params.id,
				offset,
				like,
				count;
				if (param) {
					query += "  WHERE id= ?";
					connection.query(query, [param], function (err, rows) {
						if (err) {
							res.json({
								"Error" : true,
								"Message" : "Error executing MySQL query: " + err
							});
						} else {
							res.json({
								"items" : rows,
								"count" : rows.length
							});
						}
					});
				} else if (search) {
					offset = page ? (page * limit) : 0;
					like = " WHERE name like ?";
					query += like + " limit "+ limit +" offset " + offset;
					connection.query("select count(*) as c from store " + like, ['%' + search + '%'], function (err, rows) {
						if (!err) {
							if (rows[0]) {
								count = rows[0].c;
							}
						}
					});
					connection.query(query, '%' + search + '%', function (err, rows) {
						if (err) {
							res.json({
								"Error" : true,
								"Message" : "Error executing MySQL query: " + err
							});
						} else {
							res.json({
								"items" : rows,
								"count" : (count || rows.length)
							});
						}
					});
				} else {
					connection.query(query, '%' + search + '%', function (err, rows) {
						if (err) {
							res.json({
								"Error" : true,
								"Message" : "Error executing MySQL query: " + err
							});
						} else {
							res.json({
								"items" : rows,
								"count" : (count || rows.length)
							});
						}
					});
				}
			}
		};

		self.routes['/api/item/:id*?'] = {
			get : function (req, res) {
				var query = "select * from item",
				search = req.query['q'],
				store = req.query['store'],
				page = req.query['page'] || req.query['pq_curpage'],
				count = req.query['pq_rpp']  || 10,
				param = req.params.id,
				offset = page ? ((page-1) * count) : 0,
				countQuery,
				searchQuery,
				count;
				if (param) {
					query += "  WHERE id= ?";
					connection.query(query, [param], function (err, rows) {
						if (err) {
							res.json({
								"Error" : true,
								"Message" : "Error executing MySQL query: " + err
							});
						} else {
							res.json({
								"items" : rows,
								"count" : rows.length
							});
						}
					});
				} else if (search) {
					countQuery = "select count(*) as c from item inner join store_item on id=item_id WHERE name like ? " + (store ? " and store_id = ? " : " group by item_id");

					searchQuery = "select * from item inner join store_item on id=item_id WHERE name like ? " + (store ? " and store_id = ? " : " group by item_id") + " limit " + count + " offset " + offset;


					connection.query(countQuery, ['%' + search + '%', store], function (err, rows) {
						if (!err) {
							if (rows.length > 1) {
								count = rows.length;
							} else if (rows[0]) {
								count = rows[0].c;
							}
						}
					});
					connection.query(searchQuery, ['%' + search + '%', store], function (err, rows) {
						if (err) {
							res.json({
								"Error" : true,
								"Message" : "Error executing MySQL query: " + err
							});
						} else {
							res.json({
								"items" : rows,
								"page" : JSON.parse(page),
								"prev" : JSON.parse(page)-1,
								"next" : JSON.parse(page)+1,
								"size" : rows.length,
								"count" : (count || rows.length),
								"store" : JSON.parse(store)
							});
						}
					});
				} else {
					countQuery = "select count(*) as c from item inner join store_item on id=item_id" + (store ? " WHERE store_id = ? " : " group by item_id");

					searchQuery = "select * from item inner join store_item on id=item_id" + (store ? " WHERE store_id = ? " : " group by item_id") + " limit " + count + " offset " + offset;

					connection.query(countQuery, [store], function (err, rows) {
						if (!err) {
							if (rows.length > 1) {
								count = rows.length;
							} else if (rows[0]) {
								count = rows[0].c;
							}
						}
					});
					connection.query(searchQuery, [store], function (err, rows) {
						if (err) {
							res.json({
								"Error" : true,
								"Message" : "Error executing MySQL query: " + err
							});
						} else {
							res.json({
								"items" : rows,
								"page" : JSON.parse(page),
								"prev" : JSON.parse(page)-1,
								"next" : JSON.parse(page)+1,
								"size" : rows.length,
								"count" : (count || rows.length),
								"store" : JSON.parse(store)
							});
						}
					});
				}
			}
		};


	};

	/**
	 *  Initialize the server (express) and create the routes and register
	 *  the handlers.
	 */
	self.initializeServer = function () {
		self.createRoutes();
		self.app = express();
		self.app.use(bodyParser.urlencoded({
				extended : false
			}));
		self.app.use(bodyParser.json());
		self.app.use('/lib', express.static('lib'));
		self.app.use('/arrow', express.static('arrow'));
		self.app.use('/res', express.static('res'));

		//  Add handlers for the app (from the routes).
		for (var r in self.routes) {
			var get = self.routes[r].get;
			var post = self.routes[r].post;
			var del = self.routes[r].del;
			if (get) {
				self.app.get(r, self.routes[r].get);
			}
			if (post) {
				self.app.post(r, self.routes[r].post);
			}
			if (del) {
				self.app.delete (r, self.routes[r].del);
			}
		}
	};

	/**
	 *  Initializes the sample application.
	 */
	self.initialize = function () {
		self.setupVariables();
		self.populateCache();
		self.setupTerminationHandlers();

		// Create the express server and routes.
		self.initializeServer();
		self.connectMysql();
	};

	self.connectMysql = function () {
		var self = this;
		var pool = mysql.createPool({
				connectionLimit : 100,
				host : process.env.OPENSHIFT_MYSQL_DB_HOST,
				port : process.env.OPENSHIFT_MYSQL_DB_PORT,
				user : process.env.OPENSHIFT_MYSQL_DB_USERNAME,
				password : process.env.OPENSHIFT_MYSQL_DB_PASSWORD,
				database : 'nodejs',
				debug : false
			});
		pool.getConnection(function (err, connection) {
			if (err) {
				self.stop(err);
			} else {
				this.connection = connection;
				console.log('Connected to mysql!');
			}
		});
	};
	self.stop = function (err) {
		console.log("ISSUE WITH MYSQL n" + err);
		process.exit(1);
	}
	/**
	 *  Start the server (starts up the sample application).
	 */
	self.start = function () {
		//  Start the app on the specific interface (and port).
		self.app.listen(self.port, self.ipaddress, function () {
			console.log('%s: Node server started on %s:%d ...',
				Date(Date.now()), self.ipaddress, self.port);
		});
	};

};

new CronJob('20 * * * *', function () {
	console.log("Sending request at: " + new Date());
	http.get("http://nodejs-cs995.rhcloud.com/api/store/1", function (response) {
		response.setEncoding('utf8');
		response.on('data', console.log);
		response.on('error', console.error);
	});

}, null, true, 'America/Chicago');
/*  Sample Application.  */

/**
 *  main():  Main code.
 */
var zapp = new SampleApp();
zapp.initialize();
zapp.start();


