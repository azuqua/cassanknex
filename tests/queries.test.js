/**
 * Created by austin on 4/4/15.
 */

"use strict";

var assert = require("chai").assert
  , cassanKnex = require("../index")({
    debug: false
  });

describe("QueryMethods", function () {

  // INSERT

  it("should compile an insert query string", function () {

    var cql = 'INSERT INTO "cassanKnexy"."columnFamily" ("id","bar","baz") VALUES (?, ?, ?) USING TIMESTAMP ? AND USING TTL ?;'
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
  it("should compile an insert query string, w/ if not exists", function () {

    var cql = 'INSERT INTO "cassanKnexy"."columnFamily" ("id","bar","baz") VALUES (?, ?, ?) IF NOT EXISTS USING TIMESTAMP ? AND USING TTL ?;'
      , qb = cassanKnex("cassanKnexy")
      , values = {
        "id": "foo"
        , "bar": "baz"
        , "baz": ["foo", "bar"]
      };
    qb.insert(values)
      .ifNotExists()
      .usingTimestamp(250000)
      .usingTTL(50000)
      .into("columnFamily");

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  
  // SELECT

  it("should compile a simple 'select' query string", function () {

    var cql = 'SELECT "id" FROM "cassanKnexy"."columnFamily";'
      , qb = cassanKnex("cassanKnexy");
    qb.select("id")
      .from("columnFamily");

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile a simple 'select as' w/ object input format query string", function () {

    var cql = 'SELECT "id" AS "foo" FROM "cassanKnexy"."columnFamily";'
      , qb = cassanKnex("cassanKnexy");
    qb.select({"id": "foo"})
      .from("columnFamily");

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile a simple 'select' w/ array input format query string", function () {

    var cql = 'SELECT "id" FROM "cassanKnexy"."columnFamily";'
      , qb = cassanKnex("cassanKnexy");
    qb.select(["id"])
      .from("columnFamily");

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile a simple 'select as' w/ array input format query string", function () {

    var cql = 'SELECT "id" AS "foo" FROM "cassanKnexy"."columnFamily";'
      , qb = cassanKnex("cassanKnexy");
    qb.select([{"id": "foo"}])
      .from("columnFamily");

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile an 'allow filtering' simple 'select' query string", function () {

    var cql = 'SELECT "id" FROM "cassanKnexy"."columnFamily" ALLOW FILTERING;'
      , qb = cassanKnex("cassanKnexy");
    qb.select("id")
      .allowFiltering()
      .from("columnFamily");

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile a select query string", function () {

    var cql = 'SELECT "id","foo","bar","baz" FROM "cassanKnexy"."columnFamily" WHERE "id" = ? OR "id" in (?, ?) OR "baz" = ? AND "foo" IN (?, ?) LIMIT ?;'
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

    var cql = 'SELECT "id","foo" AS "bar","bar","baz" FROM "cassanKnexy"."columnFamily" WHERE "id" = ? OR "id" in (?, ?) OR "baz" = ? AND "foo" IN (?, ?) LIMIT ?;'
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
  it("should compile a 'select' query string w/ simple orderBy", function () {

    var cql = 'SELECT "id" FROM "cassanKnexy"."columnFamily" ORDER BY "created" ASC;'
      , qb = cassanKnex("cassanKnexy");
    qb.select("id")
      .from("columnFamily")
      .orderBy("created", "asc");

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile a 'select' query string w/ complex orderBy", function () {

    var cql = 'SELECT "id" FROM "cassanKnexy"."columnFamily" ORDER BY "created" ASC "updated" DESC;'
      , qb = cassanKnex("cassanKnexy");
    qb.select("id")
      .from("columnFamily")
      .orderBy({created: "asc", updated: "desc"});

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });

  // UPDATE

  it("should compile an update query string", function () {

    var cql = 'UPDATE "cassanKnexy"."columnFamily" SET "bar" = ? WHERE "foo"[bar] = ? AND "id" in (?, ?, ?, ?, ?);'
      , qb = cassanKnex("cassanKnexy");
    qb.update("columnFamily")
      .set("bar", "baz")
      .where("foo[bar]", "=", "baz")
      .where("id", "in", ["1", "1", "2", "3", "5"]);

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile an update list query string", function () {

    var cql = 'UPDATE "cassanKnexy"."columnFamily" SET "foo" = ? WHERE "foo"[bar] = ? AND "id" in (?, ?, ?, ?, ?);'
      , qb = cassanKnex("cassanKnexy");
    qb.update("columnFamily")
      .set("foo", ["bar", "baz"])
      .where("foo[bar]", "=", "baz")
      .where("id", "in", ["1", "1", "2", "3", "5"]);

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile an update query string using an object param", function () {

    var cql = 'UPDATE "cassanKnexy"."columnFamily" SET "bar" = ?,"foo" = ? WHERE "foo"[bar] = ? AND "id" in (?, ?, ?, ?, ?);'
      , qb = cassanKnex("cassanKnexy");
    qb.update("columnFamily")
      .set({
        "bar": "baz",
        "foo": ["bar", "baz"]
      })
      .where("foo[bar]", "=", "baz")
      .where("id", "in", ["1", "1", "2", "3", "5"]);

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile an update query string using an object param /w if exists", function () {

    var cql = 'UPDATE "cassanKnexy"."columnFamily" SET "bar" = ?,"foo" = ? WHERE "foo"[bar] = ? AND "id" in (?, ?, ?, ?, ?) IF EXISTS;'
      , qb = cassanKnex("cassanKnexy");
    qb.update("columnFamily")
      .set({
        "bar": "baz",
        "foo": ["bar", "baz"]
      })
      .where("foo[bar]", "=", "baz")
      .where("id", "in", ["1", "1", "2", "3", "5"])
      .ifExists();

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile an update query string using an object param /w if conditions", function () {

    var cql = 'UPDATE "cassanKnexy"."columnFamily" SET "bar" = ?,"foo" = ? IF "bar" = ? AND "foo" = ?;'
      , qb = cassanKnex("cassanKnexy");
    qb.update("columnFamily")
      .set({
        "bar": "baz",
        "foo": "bar"
      })
      .if("bar", "=", "baz")
      .if("foo", "=", "bar");

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });

  // DELETE

  it("should compile a simple delete query string", function () {

    var cql = 'DELETE  FROM "cassanKnexy"."columnFamily" WHERE "foo"[bar] = ? AND "id" in (?, ?, ?, ?, ?);'
      , qb = cassanKnex("cassanKnexy");
    qb.delete()
      .from("columnFamily")
      .where("foo[bar]", "=", "baz")
      .where("id", "in", ["1", "1", "2", "3", "5"]);

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile a simple delete single column query string", function () {

    var cql = 'DELETE "foo" FROM "cassanKnexy"."columnFamily" WHERE "foo"[bar] = ? AND "id" in (?, ?, ?, ?, ?);'
      , qb = cassanKnex("cassanKnexy");
    qb.delete("foo")
      .from("columnFamily")
      .where("foo[bar]", "=", "baz")
      .where("id", "in", ["1", "1", "2", "3", "5"]);

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile a delete columns query string", function () {

    var cql = 'DELETE "foo","bar" FROM "cassanKnexy"."columnFamily" WHERE "foo"[bar] = ? AND "id" in (?, ?, ?, ?, ?);'
      , qb = cassanKnex("cassanKnexy");
    qb.delete("foo", "bar")
      .from("columnFamily")
      .where("foo[bar]", "=", "baz")
      .where("id", "in", ["1", "1", "2", "3", "5"]);

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile a delete columns query string using an array as input", function () {

    var cql = 'DELETE "foo","bar" FROM "cassanKnexy"."columnFamily" WHERE "foo"[bar] = ? AND "id" in (?, ?, ?, ?, ?);'
      , qb = cassanKnex("cassanKnexy");
    qb.delete(["foo", "bar"])
      .from("columnFamily")
      .where("foo[bar]", "=", "baz")
      .where("id", "in", ["1", "1", "2", "3", "5"]);

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });

});
