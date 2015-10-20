/**
 * Created by austin on 10/20/15.
 */

"use strict";

var assert = require("chai").assert;

describe("SmokeTest", function () {

  it("should compile a cassanknex client", function () {
    var cassanKnex = require("../index")({
      debug: false
    });
  });

  it("should return an error when attempting to run 'exec' via cassanknex client", function (done) {
    var cassanKnex = require("../index")({
      connection: {
        contactPoints: ["noop"]
      },
      debug: false
    });

    var qb = cassanKnex()
      .select()
      .from("fakeit")
      .exec(function (err, result) {
        assert.ok(err, "ought to error out");
        done();
      });
  });

});