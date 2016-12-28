/**
 * usage: grunt test-live
 *
 * This script will perform several executions against a given cassandra cluster.
 *
 * Created by austin on 4/29/15.
 */

"use strict";


var assert = require("chai").assert
  , _ = require("lodash")
  , async = require("async")
  , uuid = require("uuid");


describe("yolo", function () {

  var cassanKnex
    , keyspace = "cassanKnexy"
    , columnFamily = "iSiS"
    , type = "typy"
    , rows = 50;

  before(function (done) {

    this.timeout(0);
    cassanKnex = require("../../index")({
      connection: {
        contactPoints: ["127.0.0.1"]
      },
      debug: false
    });

    cassanKnex.on("ready", function (err) {
      assert(!err, "Error connecting to cassandra", err);
      done();
    });
  });

  it("should drop the keyspace (if exists) 'cassanKnexy' recreate it, " +
    "build a sample table and execute several insertions into that table, " +
    "and read records inserted using both the 'exec' and 'stream' and 'eachRow' methods" +
    " - then delete all rows from the test table.", function (done) {

    this.timeout(0);

    async.series([
      // test drop keyspace
      function (next) {

        var qb = cassanKnex()
          .dropKeyspaceIfExists(keyspace)
          .exec(next);
      },
      // test create keyspace
      function (next) {

        var qb = cassanKnex()
          .createKeyspaceIfNotExists(keyspace)
          .withSimpleStrategy(1)
          .exec(next);
      },
      // test create uudt
      function (next) {
        var qb = cassanKnex(keyspace)
          .createTypeIfNotExists(type)
          .list("keys", "text")
          .uuid("rando")
          .int("dec")
          .exec(next);
      },
      // test create column family
      function (next) {

        var qb = cassanKnex(keyspace)
          .createColumnFamilyIfNotExists(columnFamily)
          .int("id")
          .uuid("rando")
          .timestamp("timestamp")
          .map("col", "text", "text")
          .text("data")
          .frozen("written", type)
          .primary("id", "timestamp", "rando")
          .withClusteringOrderBy("timestamp", "asc")
          .withClusteringOrderBy("rando", "asc")
          .exec(next);
      },
      // test simple insert
      function (next) {

        var items = _.map(Array(rows).slice(25), function () {
          return {
            id: 1,
            rando: uuid.v4(),
            timestamp: new Date(),
            col: {"foo": "bar", "bar": "baz"},
            data: "",
            written: {keys: ["foo", "bar"], rando: uuid.v4(), dec: 42}
          };
        });

        async.eachSeries(items, function (item, done) {
          var rowKeys = {id: item.id, rando: item.rando, timestamp: null};
          async.series([
            // test insert
            function (next) {
              item.timestamp = new Date();
              rowKeys.timestamp = item.timestamp;
              var qb = cassanKnex(keyspace)
                .insert(item)
                .into(columnFamily);
              qb.exec({prepare: true}, next);
            },
            // test update
            function (next) {
              var qb = cassanKnex(keyspace)
                .update(columnFamily)
                .set({data: "new and improved"})
                .remove("col", ["foo"])
                .where("id", "=", rowKeys.id)
                .where("rando", "=", rowKeys.rando)
                .where("timestamp", "=", rowKeys.timestamp);
              qb.exec({prepare: true}, next);
            }
          ], done);
        }, next);
      },
      // test batch method
      function (next) {

        var cassakni = _.map(Array(rows).slice(25), function () {

          var item = {
              id: 2,
              rando: uuid.v4(),
              timestamp: new Date(),
              data: "",
              written: {keys: ["foo", "bar"], rando: uuid.v4(), dec: 42}
            }
            , qb = cassanKnex(keyspace)
              .insert(item)
              .into(columnFamily);

          return qb;
        });

        cassanKnex().batch({prepare: true}, cassakni, next);
      },
      // test the execution method
      function (next) {

        var qb = cassanKnex(keyspace)
          .select()
          .from(columnFamily)
          .exec({prepare: true}, function (err, resp) {
            assert(!err, err);
            assert(resp.rowLength === rows, "Must have read as many rows as was inserted");
            next(err);
          });
      },
      // test the execution method w/ order by
      function (next) {

        var qb = cassanKnex(keyspace)
          .select()
          .from(columnFamily)
          .where("id", "=", 1)
          .orderBy("timestamp", "desc")
          .exec({prepare: true}, function (err, resp) {
            assert(!err, err);
            next(err);
          });
      },
      // test the stream method
      function (next) {

        var onReadable = function () {
            // Readable is emitted as soon a row is received and parsed
            var row;
            while (row = this.read()) {
              assert(_.has(row, "id"), "Response must contain the id.");
            }
          }
          , onEnd = function () {
            // Stream ended, there aren't any more rows
            next();
          }
          , onError = function (err) {
            // Something went wrong: err is a response error from Cassandra
            assert(!err, "query error", err);
            next(err);
          };

        var qb = cassanKnex(keyspace)
          .select()
          .from(columnFamily);

        // Invoke the stream method
        qb.stream({
          "readable": onReadable,
          "end": onEnd,
          "error": onError
        });
      },
      // test the eachRow method
      function (next) {

        var rowCallback = function (n, row) {
            // Readable is emitted as soon a row is received and parsed
            assert(_.has(row, "id"), "Response must contain the id.");
          }
          , errorCb = function (err) {
            // Something went wrong: err is a response error from Cassandra
            assert(!err, "query error", err);
            next(err);
          };

        var qb = cassanKnex(keyspace)
          .select()
          .from(columnFamily);

        // Invoke the eachRow method
        qb.eachRow(rowCallback, errorCb);
      },
      // test the eachRow method w/ options
      function (next) {

        var fetchSize = 25;

        var rowCallback = function (n, row) {
            // Readable is emitted as soon a row is received and parsed
            assert(n < fetchSize, "The number of rows should stay w/i options fetchSize bounds.");
            assert(_.has(row, "id"), "Response must contain the id.");
          }
          , errorCb = function (err) {
            // Something went wrong: err is a response error from Cassandra
            assert(!err, "query error", err);
            next(err);
          };

        var qb = cassanKnex(keyspace)
          .select()
          .from(columnFamily);

        // Invoke the eachRow method
        qb.eachRow({fetchSize: fetchSize}, rowCallback, errorCb);
      },
      // test the delete method
      function (next) {

        async.waterfall([
          function (next) {

            var qb = cassanKnex(keyspace)
              .select()
              .from(columnFamily)
              .exec(function (err, resp) {
                assert(!err, err);
                next(err, resp.rows);
              });
          },
          function (rows, next) {

            async.each(rows, function (row, done) {

              var qb = cassanKnex(keyspace)
                .delete()
                .from(columnFamily)
                .where("id", "=", row.id)
                .andWhere("rando", "=", row.rando)
                .andWhere("timestamp", "=", row.timestamp)
                .exec({prepare: true}, function (err, resp) {
                  assert(!err, err);
                  done(err);
                });
            }, next);
          }
        ], next);
      },
      // confirm the delete worked
      function (next) {

        var qb = cassanKnex(keyspace)
          .select()
          .from(columnFamily)
          .exec(function (err, resp) {
            assert(!err, err);
            assert(resp.rowLength === 0, "All rows must be deleted!");
            next(err);
          });
      },
      // test the truncate execution
      function (next) {

        var qb = cassanKnex(keyspace)
          .truncate(columnFamily)
          .exec(function (err, resp) {
            assert(!err, err);
            next(err);
          });
      }
    ], function (err) {

      if (err) {
        console.log(err);
      }
      assert(!err);
      done();
    });
  });
});
