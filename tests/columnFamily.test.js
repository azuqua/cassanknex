/**
 * Created by austin on 4/29/15.
 */

"use strict";

var assert = require("chai").assert
  , cassanKnex = require("../index")({
    debug: false
  });


describe("ColumnFamilyMethods", function () {

  // CREATE COLUMN FAMILY

  it("should compile a create column family statement", function () {

    var cql = "CREATE COLUMNFAMILY cassanKnexy.columnFamily ( textType TEXT, PRIMARY KEY (textType) ) ;"
      , qb = cassanKnex("cassanKnexy")
        .createColumnFamily("columnFamily")
        .text("textType")
        .primary("textType");

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile a create column family if not exists statement", function () {

    var cql = "CREATE COLUMNFAMILY IF NOT EXISTS cassanKnexy.columnFamily ( textType TEXT, PRIMARY KEY (textType) ) ;"
      , qb = cassanKnex("cassanKnexy");
    qb.createColumnFamilyIfNotExists("columnFamily")
      .text("textType")
      .primary("textType");

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile a create column family statement w/ a composite partition key.", function () {

    var cql = "CREATE COLUMNFAMILY cassanKnexy.columnFamily ( textType TEXT, uuidType UUID, timestamp TIMESTAMP, PRIMARY KEY ((textType, uuidType), timestamp) ) ;"
      , qb = cassanKnex("cassanKnexy")
        .createColumnFamily("columnFamily")
        .text("textType")
        .uuid("uuidType")
        .timestamp("timestamp")
        .primary(["textType", "uuidType"], "timestamp");

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile a create column family statement w/ a composite partition key and clustering.", function () {

    var cql = "CREATE COLUMNFAMILY cassanKnexy.columnFamily ( textType TEXT, uuidType UUID, timestamp TIMESTAMP, PRIMARY KEY ((textType, uuidType), timestamp) ) WITH CLUSTERING ORDER BY ( timestamp DESC ) ;"
      , qb = cassanKnex("cassanKnexy")
        .createColumnFamily("columnFamily")
        .text("textType")
        .uuid("uuidType")
        .timestamp("timestamp")
        .primary(["textType", "uuidType"], "timestamp")
        .withClusteringOrderBy("timestamp", "desc");

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile a create column family statement w/ a compound index", function () {

    var cql = "CREATE COLUMNFAMILY cassanKnexy.columnFamily ( uuidType UUID, timestampType TIMESTAMP, PRIMARY KEY (uuidType, timestampType) ) ;"
      , qb = cassanKnex("cassanKnexy");
    qb.createColumnFamily("columnFamily")
      .uuid("uuidType")
      .timestamp("timestampType")
      .primary("uuidType", "timestampType");

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile a create column family statement w/ all column types", function () {

    var cql = "CREATE COLUMNFAMILY cassanKnexy.columnFamily ( frozenList LIST <list<text>>, listType LIST <text>, setType SET <timestamp>, decimalType DECIMAL, booleanType BOOLEAN, blobType BLOB, timestampType TIMESTAMP, inetType INET, bigintType BIGINT, counterType COUNTER, doubleType DOUBLE, intType INT, floatType FLOAT, mapType MAP <uuid,text>, asciiType ASCII, textType TEXT, timeuuidType TIMEUUID, uuidType UUID, varcharType VARCHAR, PRIMARY KEY (uuidType) ) ;"
      , qb = cassanKnex("cassanKnexy");
    qb.createColumnFamily("columnFamily")
      .list("frozenList", "list<text>")
      .list("listType", "text")
      .set("setType", "timestamp")
      .decimal("decimalType")
      .boolean("booleanType")
      .blob("blobType")
      .timestamp("timestampType")
      .inet("inetType")
      .bigint("bigintType")
      .counter("counterType")
      .double("doubleType")
      .int("intType")
      .float("floatType")
      .map("mapType", "uuid", "text")
      .ascii("asciiType")
      .text("textType")
      .timeuuid("timeuuidType")
      .uuid("uuidType")
      .varchar("varcharType")
      .primary("uuidType");

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile a create statement w/ compression, compaction and caching options", function () {

    var cql = "CREATE COLUMNFAMILY cassanKnexy.columnFamily WITH compression = { 'sstable_compression ' : 'DeflateCompressor' , 'chunk_length_kb' : '64' } AND compaction = { 'class' : 'SizeTieredCompactionStrategy' , 'cold_reads_to_omit' : '0.05' } AND caching = { 'rows_per_partition' : '25' };"
      , qb = cassanKnex("cassanKnexy");
    qb.createColumnFamily("columnFamily")
      .withCompression({"sstable_compression ": "DeflateCompressor", "chunk_length_kb": 64})
      .withCompaction({"class": "SizeTieredCompactionStrategy", "cold_reads_to_omit": 0.05})
      .withCaching({"rows_per_partition": 25});

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });

  // ALTER COLUMN FAMILY

  it("should compile an alter column alter column family statement", function () {

    var cql = "ALTER TABLE cassanKnexy.columnFamily ALTER columnName TYPE columnType;"
      , qb = cassanKnex("cassanKnexy")
        .alterColumnFamily("columnFamily")
        .alter("columnName", "columnType");

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile a rename column alter column family statement", function () {

    var cql = "ALTER TABLE cassanKnexy.columnFamily RENAME old TO new;"
      , qb = cassanKnex("cassanKnexy")
        .alterColumnFamily("columnFamily")
        .rename("old", "new");

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile a drop column alter column family statement", function () {

    var cql = "ALTER TABLE cassanKnexy.columnFamily DROP columnName1 DROP columnName2;"
      , qb = cassanKnex("cassanKnexy")
        .alterColumnFamily("columnFamily")
        .drop("columnName1", "columnName2");

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile an add column alter column family statement", function () {

    var cql = "ALTER TABLE cassanKnexy.columnFamily ADD uuidType UUID ADD varcharType VARCHAR;"
      , qb = cassanKnex("cassanKnexy")
        .alterColumnFamily("columnFamily")
        .uuid("uuidType")
        .varchar("varcharType");

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });

  // CREATE INDEX

  it("should compile a create index statement", function () {

    var cql = "CREATE INDEX foo_key ON cassanKnexy.columnFamily ( foo );"
      , qb = cassanKnex("cassanKnexy")
        .createIndex("columnFamily", "foo_key", "foo");

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });

  // DROP COLUMN FAMILY

  it("should compile a drop column family statement", function () {

    var cql = "DROP COLUMNFAMILY cassanKnexy.columnFamily ;"
      , qb = cassanKnex("cassanKnexy")
        .dropColumnFamily("columnFamily");

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
  it("should compile a drop column family if exists statement", function () {

    var cql = "DROP COLUMNFAMILY IF EXISTS cassanKnexy.columnFamily ;"
      , qb = cassanKnex("cassanKnexy")
        .dropColumnFamilyIfExists("columnFamily");

    var _cql = qb.cql();
    assert(_cql === cql, "Expected compilation: '" + cql + "' but compiled: " + _cql);
  });
});