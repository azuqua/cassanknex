/**
 * Created by austin on 3/31/15.
 */

"use strict";

var _ = require("lodash");

/**
 * Creates a CQL 'map' statement value from a given Javascript object
 *
 * @param obj
 * @returns {string}
 */
module.exports.toMapString = function (obj) {
  var out = "{"
    , self = this
    , values = [];
  _.each(obj, function (v, k) {
    if (typeof v === "object")
      values.push(" '" + k + "' : '" + self.toMapString(v) + " ");
    else
      values.push(" '" + k + "' : '" + v + "' ");
  });

  out += values.join(",");
  out += "}";
  return out;
};

/**
 * Turns an array of values into a commas delineated string of '?''s
 * while simultaneous pushing the values into the clients _bindings array.
 * Note that the _bindings array will ONLY be populated upon a queries execution,
 * or if client.debug() returns true.
 *
 * @param values
 * @param client
 * @returns {string}
 */
module.exports.parameterize = function (values, client) {
  values = _.isArray(values) ? values : [values];
  if (client.debug() || client.executing()) {
    _.each(values, function (value) {
      client._bindings.push(value);
    });
  }
  return _.map(values, this.parameter, this).join(", ");
};

/**
 * Same as `parameterize` except that it inserts the entire value param into the bindings array
 *
 * @param value
 * @param client
 * @returns {string}
 */
module.exports.parameterizeArray = function (value, client) {
  if (client.debug() || client.executing()) {
    client._bindings.push(value);
  }
  return this.parameter();
};

/**
 * Returns the CQL string value used to parametize a binding in the CQL statement
 *
 * @returns {string}
 */
module.exports.parameter = function () {
  return "?";
};

/**
 * Wrap a string w/ quotes
 *
 * @param string
 * @returns {string}
 */
module.exports.wrapQuotes = function (string) {
  return "\"" + string + "\"";
};
