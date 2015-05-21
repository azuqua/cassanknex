/**
 * Created by austin on 4/4/15.
 */

"use strict";

var assert = require("chai").assert
  , cassanKnex = require("../index")({
    debug: false
  });

describe("QueryMethods", function () {
  it("should compile an insert query string", function () {

    var cql = "INSERT INTO cassanKnexy.columnFamily (id,bar,baz) VALUES (?, ?, ?) USING TIMESTAMP ? AND USING TTL ?;"
      , qb = cassanKnex("cassanKnexy")
      , values = {
        "id": "foo"
        , "bar": "baz"
        , "baz": ["foo", "bar"]
      };
    qb.insert(values)
      .usingTimestamp(250000)
      .usingTTL(50000)
      .into("columnFamily");

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile a simple 'select' query string", function () {

    var cql = "SELECT id FROM cassanKnexy.columnFamily;"
      , qb = cassanKnex("cassanKnexy");
    qb.select("id")
      .from("columnFamily");

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile a simple 'select as' w/ object input format query string", function () {

    var cql = "SELECT id AS foo FROM cassanKnexy.columnFamily;"
      , qb = cassanKnex("cassanKnexy");
    qb.select({"id": "foo"})
      .from("columnFamily");

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile a simple 'select' w/ array input format query string", function () {

    var cql = "SELECT id FROM cassanKnexy.columnFamily;"
      , qb = cassanKnex("cassanKnexy");
    qb.select(["id"])
      .from("columnFamily");

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile a simple 'select as' w/ array input format query string", function () {

    var cql = "SELECT id AS foo FROM cassanKnexy.columnFamily;"
      , qb = cassanKnex("cassanKnexy");
    qb.select([{"id": "foo"}])
      .from("columnFamily");

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile a select query string", function () {

    var cql = "SELECT id,foo,bar,baz FROM cassanKnexy.columnFamily WHERE id = ? OR id in (?, ?) OR baz = ? AND foo IN (?, ?) LIMIT ?;"
      , qb = cassanKnex("cassanKnexy");
    qb.select("id", "foo", "bar", "baz")
      .where("id", "=", "1")
      .orWhere("id", "in", ["2", "3"])
      .orWhere("baz", "=", "bar")
      .andWhere("foo", "IN", ["baz", "bar"])
      .limit(10)
      .from("columnFamily");

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile a 'select as' query string", function () {

    var cql = "SELECT id,foo AS bar,bar,baz FROM cassanKnexy.columnFamily WHERE id = ? OR id in (?, ?) OR baz = ? AND foo IN (?, ?) LIMIT ?;"
      , qb = cassanKnex("cassanKnexy");
    qb.select("id", {"foo": "bar"}, "bar", "baz")
      .where("id", "=", "1")
      .orWhere("id", "in", ["2", "3"])
      .orWhere("baz", "=", "bar")
      .andWhere("foo", "IN", ["baz", "bar"])
      .limit(10)
      .from("columnFamily");

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile an update query string", function () {

    var cql = "UPDATE cassanKnexy.columnFamily SET bar = ? WHERE foo[bar] = ? AND id in (?, ?, ?, ?, ?);"
      , qb = cassanKnex("cassanKnexy");
    qb.update("columnFamily")
      .set("bar", "baz")
      .where("foo[bar]", "=", "baz")
      .where("id", "in", ["1", "1", "2", "3", "5"]);

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile an update list query string", function () {

    var cql = "UPDATE cassanKnexy.columnFamily SET foo = ? WHERE foo[bar] = ? AND id in (?, ?, ?, ?, ?);"
      , qb = cassanKnex("cassanKnexy");
    qb.update("columnFamily")
      .set("foo", ["bar", "baz"])
      .where("foo[bar]", "=", "baz")
      .where("id", "in", ["1", "1", "2", "3", "5"]);

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
});
