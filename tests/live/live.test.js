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
    , keyspace = "cassanknexy"
    , columnFamily = "isis"
    , rows = 50;

  before(function (done) {

    this.timeout(0);
    cassanKnex = require("../../index")({
      connection: {
        contactPoints: ["10.0.0.2"]
      },
      debug: false
    });

    cassanKnex.on("ready", function (err) {
      assert(!err, "Error connecting to cassandra", err);
      done();
    });
  });

  it("should drop the keyspace (if exists) 'cassanknexy' recreate it, " +
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
      // test create column family
      function (next) {

        var qb = cassanKnex(keyspace)
          .createColumnFamilyIfNotExists(columnFamily)
          .uuid("id")
          .timestamp("timestamp")
          .text("data")
          .primary("id", "timestamp")
          .exec(next);
      },
      // test simple insert
      function (next) {

        var items = _.map(Array(rows), function () {
          return {id: uuid.v4(), timestamp: new Date(), data: ""};
        });

        async.each(items, function (item, done) {

          var qb = cassanKnex(keyspace)
            .insert(item)
            .into(columnFamily)
            .exec(done);
        }, next);
      },
      // test the execution method
      function (next) {

        var qb = cassanKnex(keyspace)
          .select()
          .from(columnFamily)
          .exec(function (err, resp) {
            assert(!err, err);
            assert(resp.rowLength === rows, "Must have read as many rows as was inserted");
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
                .andWhere("timestamp", "=", row.timestamp)
                .exec(function (err, resp) {
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
