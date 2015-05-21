/**
 * Created by austin on 3/29/15.
 */

"use strict";

var _ = require("lodash")

  , components = require("../componentDeclarations/components")
  , methods = require("../componentDeclarations/componentBuilderMethods")[components.keyspace];

var nameToCallMap = {};
_.each(Object.keys(methods), function (method) {
  nameToCallMap[methods[method].name] = method;
});

var keyspaceBuilder = {};

_.each(Object.keys(methods), function (method) {
  switch (methods[method].grouping) {
    case "strategy":
      keyspaceBuilder[method] = function () {
        return this._wrapMethod(null, methods[method].name, _getStrategyGrouping(methods[method].name), arguments);
      };
      break;
    case "and":
      keyspaceBuilder[method] = function () {
        return this._wrapMethod(null, methods[method].name, _getAndGrouping(methods[method].name), arguments);
      };
      break;
  }
});

/**
 * Returns function used to build the `with replication` clause in a create keyspace statement
 *
 * @param _class
 * @returns {Function}
 * @private
 */
function _getStrategyGrouping(_class) {

  return function () {

    var replicationParams = _.toArray(arguments)
      , replication = {"class": _class};

    if (_class === methods.withSimpleStrategy.name) {
      if (typeof replicationParams[0] === "undefined")
        throw new Error("SimpleStrategy requires replication parameters.");

      replication.replication_factor = replicationParams[0];
    }
    else if (_class === methods.withNetworkTopologyStrategy.name) {

      var filter = function (param) {
        return typeof param === "object" && Object.keys(param).length >= 1;
      };
      var dataCenterParams = _.filter(arguments, filter);
      if (!dataCenterParams.length)
        throw new Error("NetworkTopologyStrategy requires a variable length argument list of data center param objecs => '{ dataCenterName: dataCenterReplicationFactor }'.");

      _.each(dataCenterParams, function (dataCenterParam) {
        _.each(Object.keys(dataCenterParam), function (k) {
          replication[k] = dataCenterParam[k];
        });
      });
    }

    this._statements.push({
      grouping: "strategy",
      type: methods[nameToCallMap[_class]].name,
      value: replication
    });

    return this;
  };
}

/**
 * returns function used to build the `and` clause of a create keyspace statement
 *
 * @param type
 * @returns {Function}
 * @private
 */
function _getAndGrouping(type) {
  return function () {
    var boolean = _.toArray(arguments);

    this._statements.push({
      grouping: "and",
      type: type,
      value: arguments[0] ? arguments[0] : false
    });

    return this;
  };
}

module.exports = keyspaceBuilder;
