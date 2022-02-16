/**
 * Created by austin on 3/29/15.
 */

"use strict";

var _ = require("lodash")
  , cassandraDriver = require("cassandra-driver")

  , _package = require("./package.json")
  , Client = require("./Client");

var cassandra = null
  , duckType = "[Object CassanKnex]";

/**
 * Constructor object, creates and returns a new cassanknex client
 *
 * @returns {cassanKnex}
 * @constructor
 */
function CassanKnex() {
  return CassanKnex.initialize.apply(null, arguments);
}

/**
 * Initializes a new CassanKnex object.
 *
 * @param config
 * @returns {cassanKnex}
 */
CassanKnex.initialize = function (config) {

  var EventEmitter = require('events').EventEmitter;

  function cassanKnex(keyspace, table) {
    var qb = new Client(config || {});
    qb._cassandra = cassandra;

    // Passthrough all "start" and "query" events to the cassanKnex object.
    qb.on('start', function (obj) {
      cassanKnex.emit('start', obj);
    });
    qb.on('query', function (obj) {
      cassanKnex.emit('query', obj);
    });

    if (keyspace && table) {
      qb.use(keyspace);
      qb.table(table);
    }
    else if (keyspace) {
      qb.use(keyspace);
    }

    qb.toString = function () {
      return duckType;
    };

    _attachExecMethod(qb);
    _attachStreamMethod(qb);
    _attachEachRowMethod(qb);
    _attachBatchMethod(qb);

    return qb;
  }

  /**
   * Get the cassandra driver currently in use by cassanknex.
   * @returns {cassandra-driver}
   */
  cassanKnex.getClient = function () {
    return cassandra;
  };

  /**
   * Get the raw datastax cassandra driver module.
   * @returns {cassandra-driver}
   */
  cassanKnex.getDriver = function () {
    return cassandraDriver;
  };

  // Set instance version
  cassanKnex.VERSION = cassanKnex.__cassanKnex__ = _package.version;

  // Hook up the "cassanKnex" object as an EventEmitter.
  var ee = new EventEmitter();
  for (var key in ee) {
    cassanKnex[key] = ee[key];
  }

  /**
   * Ducks Typing
   * @returns {string}
   */
  cassanKnex.toString = function () {
    return duckType;
  };

  if (config && config.connection) {
    if (config.connection.contactPoints) {
      // initialize a new driver using included lib
      cassandra = new cassandraDriver.Client(config.connection);
      cassandra.connect(function (err) {
        cassanKnex.emit("ready", err);
      });
    }
    else if (config.connection.connected) {
      // assume it's an initialized driver
      cassandra = config.connection;
      process.nextTick(function () {
        cassanKnex.emit("ready");
      });
    }
    else {
      // oops
      process.nextTick(function () {
        cassanKnex.emit("ready", new Error("Client initialization requires either connection arguments or an initialized cassandra driver."));
      });
    }
  }

  return cassanKnex;
};

//Check if the cql is a DDL Statement
//Return false if it is a DML Statement
function _isDDL(cql) {
  const command = cql.split(' ')[0];
  if(command === "SELECT" ||
    command === "INSERT" ||
    command === "UPDATE" ||
    command === "DELETE") {
      return false;
    }
  return true;
}

/**
 * hooks the 'exec' cassandra client method to our query builder object
 * @param qb
 * @private
 */
function _attachExecMethod(qb) {
  /**
   * Create the exec function for a pass through to the datastax driver.
   *
   * @param `{Object} options` optional argument passed to datastax driver upon query execution
   * @param `{Function} cb` => function(err, result) {}
   * @returns {Client|exports|module.exports}
   */
  qb.exec = function (options, cb) {

    var _options = typeof options !== "undefined" && _.isFunction(options) ? {} : options
      , _cb;

    if (!_.has(_options, "prepare")) {
      _options.prepare = qb._execPrepare;
    }

    if (_.isFunction(options)) {
      _cb = options;
    }
    else if (_.isFunction(cb)) {
      _cb = cb;
    }
    else {
      _cb = _.noop;
    }

    if (cassandra !== null && cassandra.connected) {
      var cql = qb.cql();
      //Aws Keyspaces does not support prepared statements for DDL but does for DML
      //So if the cql is DDL we don't send { prepare: true } options
      //https://docs.aws.amazon.com/keyspaces/latest/devguide/functional-differences.html#functional-differences.prepared-statements
      //This is required to be set to false and not removed as it will use the default in queryOptions
      if(qb.awsKeyspace() && _isDDL(cql) && _options.prepare) {
        _options.prepare=false;
      }

      cassandra.execute(cql, qb.bindings(), _options, _cb);
    }
    else {
      _cb(new Error("Cassandra client is not initialized."));
    }

    // maintain chain
    return qb;
  };
}

/**
 * hooks the 'stream' cassandra client method to our query builder object
 * @param qb
 * @private
 */
function _attachStreamMethod(qb) {
  /**
   * Create the stream function for a pass through to the datastax driver,
   * all callbacks are defaulted to lodash#noop if not declared.
   *
   * @param `{Object} options` optional argument passed to datastax driver upon query execution
   * @param `{Object} cbs` =>
   * {
     *  readable: function() {},
     *  end: function() {},
     *  error: function(err) {}
     * }
   * @returns {Client|exports|module.exports}
   */
  qb.stream = function (options, cbs) {

    var _options = _.isObject(cbs) ? options : {}
      , _cbs = _.isObject(cbs) ? cbs : options
      , onReadable = _cbs.readable || _.noop
      , onEnd = _cbs.end || _.noop
      , onError = _cbs.error || _.noop;

    if (cassandra !== null && cassandra.connected) {
      var cql = qb.cql();
      cassandra.stream(cql, qb.bindings(), _options)
        .on("readable", onReadable)
        .on("end", onEnd)
        .on("error", onError);
    }
    else {
      console.error("Cassandra client is not initialized.");
      onError(new Error("Cassandra client is not initialized."));
    }

    // maintain chain
    return qb;
  };
}

/**
 * hooks the 'eachRow' cassandra client method to our query builder object
 * @param qb
 * @private
 */
function _attachEachRowMethod(qb) {
  /**
   * Create the eachRow function for a pass through to the datastax driver.
   *
   * @param `{Object} options` optional argument passed to datastax driver upon query execution
   * @param `{Function} rowCb` => function(row) {}
   * @param `{Function} errorCb` => function(err) {}
   * @returns {Client|exports|module.exports}
   */
  qb.eachRow = function (options, rowCb, errorCb) {

    // options is really rowCB
    if (_.isFunction(options)) {
      errorCb = rowCb;
      rowCb = options;
    }

    var _options = _.isObject(options) ? options : {};

    if (!_.isFunction(rowCb)) {
      rowCb = _.noop;
    }
    if (!_.isFunction(errorCb)) {
      errorCb = _.noop;
    }

    if (cassandra !== null && cassandra.connected) {
      var cql = qb.cql();
      cassandra.eachRow(cql, qb.bindings(), _options, rowCb, errorCb);
    }
    else {
      errorCb(new Error("Cassandra client is not initialized."));
    }

    // maintain chain
    return qb;
  };
}

/**
 * hooks the 'batch' cassandra client method to our query builder object
 * @param qb
 * @private
 */
function _attachBatchMethod(qb) {
  /**
   *
   * @param options
   * @param cassakni
   * @param cb
   * @returns {Client|exports|module.exports}
   */
  qb.batch = function (options, cassakni, cb) {

    var _options
      , _cassakni
      , _cb;

    // options is really cassakni, cassakni is cb
    if (_.isArray(options)) {
      _options = {};
      _cassakni = options;
      _cb = cassakni;
    }
    // standard order
    else {
      _options = options;
      _cassakni = cassakni;
      _cb = cb;
    }

    if (!_.isFunction(_cb)) {
      _cb = _.noop;
    }

    if (cassandra !== null && cassandra.connected) {

      var error = null
        , statements = _.map(_cassakni, function (qb) {

          if (!qb.toString || qb.toString() !== duckType) {
            error = new Error("Invalid input to CassanKnex#batch.");
            return {};
          }
          else {
            return {query: qb.cql(), params: qb.bindings()};
          }
        });

      if (error) {
        return _cb(error);
      }

      cassandra.batch(statements, _options, _cb);
    }
    else {
      _cb(new Error("Cassandra client is not initialized."));
    }

    // maintain chain
    return qb;
  };
}

module.exports = CassanKnex;
