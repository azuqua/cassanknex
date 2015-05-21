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
    , columnFamily = "isis";

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

  it("should create a keyspace and table and execute several insertions into the table", function (done) {

    this.timeout(0);

    async.series([
      function (next) {

        var qb = cassanKnex()
          .createKeyspaceIfNotExists(keyspace)
          .withSimpleStrategy(1)
          .exec(next);
      },
      function (next) {

        var qb = cassanKnex(keyspace)
          .createColumnFamilyIfNotExists(columnFamily)
          .uuid("id")
          .timestamp("timestamp")
          .text("data")
          .primary("id", "timestamp")
          .exec(next);
      },
      function (next) {

        var items = _.map(Array(50), function () {
          return {id: uuid.v4(), timestamp: Date.now(), data: ""};
        });

        async.each(items, function (item, done) {

          var qb = cassanKnex(keyspace)
            .insert(item)
            .into(columnFamily)
            .exec(done);
        }, next);
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
