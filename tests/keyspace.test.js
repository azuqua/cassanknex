/**
 * Created by austin on 4/27/15.
 */

"use strict";

var assert = require("chai").assert
  , cassanKnex = require("../index")({
    debug: false
  });


describe("KeyspaceMethods", function () {

  // CREATE KEYSPACE

  it("should complile a create keyspace statement", function () {

    var cql = 'CREATE KEYSPACE "cassanKnexy";'
      , qb = cassanKnex();
    qb.createKeyspace("cassanKnexy");

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should complile a create keyspace if not exists statement", function () {

    var cql = 'CREATE KEYSPACE IF NOT EXISTS "cassanKnexy";'
      , qb = cassanKnex();
    qb.createKeyspaceIfNotExists("cassanKnexy");

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile a create keyspace statement w/ replication simple strategy", function () {

    var cql = "CREATE KEYSPACE \"cassanKnexy\" WITH REPLICATION = { 'class' : 'SimpleStrategy' , 'replication_factor' : '1' };"
      , qb = cassanKnex();
    qb.createKeyspace("cassanKnexy")
      .withSimpleStrategy(1);

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile a create keyspace statement w/ network topology strategy using single object param", function () {

    var cql = "CREATE KEYSPACE \"cassanKnexy\" WITH REPLICATION = { 'class' : 'NetworkTopologyStrategy' , 'dataCenter1' : '1' , 'dataCenter2' : '2' };"
      , qb = cassanKnex();
    qb.createKeyspace("cassanKnexy")
      .withNetworkTopologyStrategy({"dataCenter1": 1, "dataCenter2": 2});

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile a create keyspace statement w/ network topology strategy using mult object params", function () {

    var cql = "CREATE KEYSPACE \"cassanKnexy\" WITH REPLICATION = { 'class' : 'NetworkTopologyStrategy' , 'dataCenter1' : '1' , 'dataCenter2' : '2' };"
      , qb = cassanKnex();
    qb.createKeyspace("cassanKnexy")
      .withNetworkTopologyStrategy({"dataCenter1": 1}, {"dataCenter2": 2});

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile a create keyspace statement w/ durable writes false and network topology strategy using single object param", function () {

    var cql = "CREATE KEYSPACE \"cassanKnexy\" WITH REPLICATION = { 'class' : 'NetworkTopologyStrategy' , 'dataCenter1' : '1' , 'dataCenter2' : '2' } AND DURABLE_WRITES = false;"
      , qb = cassanKnex();
    qb.createKeyspace("cassanKnexy")
      .withNetworkTopologyStrategy({"dataCenter1": 1, "dataCenter2": 2})
      .withDurableWrites(false);

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });

  // ALTER KEYSPACE

  it("should compile an alter keyspace statement w/ network topology strategy using single object param", function () {

    var cql = "ALTER KEYSPACE \"cassanKnexy\" WITH REPLICATION = { 'class' : 'NetworkTopologyStrategy' , 'dataCenter1' : '1' , 'dataCenter2' : '2' };"
      , qb = cassanKnex();
    qb.alterKeyspace("cassanKnexy")
      .withNetworkTopologyStrategy({"dataCenter1": 1, "dataCenter2": 2});

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile an alter keyspace if exists statement w/ network topology strategy using single object param", function () {

    var cql = "ALTER KEYSPACE IF EXISTS \"cassanKnexy\" WITH REPLICATION = { 'class' : 'NetworkTopologyStrategy' , 'dataCenter1' : '1' , 'dataCenter2' : '2' };"
      , qb = cassanKnex();
    qb.alterKeyspaceIfExists("cassanKnexy")
      .withNetworkTopologyStrategy({"dataCenter1": 1, "dataCenter2": 2});

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });

  // DROP KEYSPACE

  it("should complile a drop keyspace statement", function () {

    var cql = 'DROP KEYSPACE "cassanKnexy";'
      , qb = cassanKnex();
    qb.dropKeyspace("cassanKnexy");

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should complile a drop keyspace if exists statement", function () {

    var cql = 'DROP KEYSPACE IF EXISTS "cassanKnexy";'
      , qb = cassanKnex();
    qb.dropKeyspaceIfExists("cassanKnexy");

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
});
