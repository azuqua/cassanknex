/**
 * Created by austin on 3/29/15.
 */

"use strict";

var _ = require("lodash")
  , cassandraDriver = require("cassandra-driver")

  , _package = require("./package.json")
  , Client = require("./Client");

var cassandra = null;

function CassanKnex() {
  return CassanKnex.initialize.apply(null, arguments);
}

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

    qb.exec = function (options, cb) {

      var _options = _.isFunction(options) ? {} : options
        , _cb;

      if (!_.has(options, "prepare")) {
        options.prepare = qb._execPrepare;
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
        cassandra.execute(cql, qb.bindings(), _options, _cb);
      }
      else {
        cb(new Error("Cassandra client is not initialized."));
      }

      // maintain chain
      return qb;
    };

    return qb;
  }

  // Set instance version
  cassanKnex.VERSION = cassanKnex.__cassanKnex__ = _package.version;

  // Hook up the "cassanKnex" object as an EventEmitter.
  var ee = new EventEmitter();
  for (var key in ee) {
    cassanKnex[key] = ee[key];
  }

  cassanKnex.toString = function () {
    return "[Object CassanKnex]";
  };

  if (config && config.connection) {
    cassandra = new cassandraDriver.Client(config.connection);
    cassandra.connect(function (err) {
      cassanKnex.emit("ready", err);
    });
  }

  return cassanKnex;
};

module.exports = CassanKnex;
