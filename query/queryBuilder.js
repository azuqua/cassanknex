/**
 * Created by austin on 3/31/15.
 */

"use strict";

var _ = require("lodash")

  , components = require("../componentDeclarations/components")
  , methods = require("../componentDeclarations/componentBuilderMethods")[components.query];

var queryBuilder = module.exports;

_.each(Object.keys(methods), function (method) {
  switch (methods[method].grouping) {
    case "source":
      queryBuilder[method] = function () {
        return this._wrapMethod(null, methods[method].name, _getDest(methods[method].name), arguments);
      };
      break;
    case "where":
      queryBuilder[method] = function () {
        return this._wrapMethod(null, methods[method].name, _getWhere(methods[method].name), arguments);
      };
      break;
    case "set":
      queryBuilder[method] = function () {
        return this._wrapMethod(null, methods[method].name, _getSet(methods[method].name), arguments);
      };
      break;
    case "using":
      queryBuilder[method] = function () {
        return this._wrapMethod(null, methods[method].name, _getUsing(methods[method].name), arguments);
      };
      break;
    case "limit":
      queryBuilder[method] = function () {
        return this._wrapMethod(null, methods[method].name, _getLimit(methods[method].name), arguments);
      };
      break;
  }
});

function _getDest() {
  return function (columnFamily) {
    this._setColumnFamily(columnFamily);
    return this;
  };
}

function _getWhere(type) {
  return function (identifier, op, value) {

    var statement = {
      grouping: "where",
      type: type,
      op: op,
      key: identifier,
      val: value
    };
    this._statements.push(statement);

    return this;
  };
}

function _getSet(type) {
  return function (identifier, value) {

    var statement = {
      grouping: "set",
      type: type,
      key: identifier,
      val: value
    };
    this._statements.push(statement);

    return this;
  };
}

function _getUsing(type) {
  return function (val) {

    var statement = {
      grouping: "using",
      type: type,
      val: val
    };
    this._statements.push(statement);

    return this;
  };
}

function _getLimit() {
  return function (limit) {
    this._single.limit = {grouping: "limit", limit: limit};

    return this;
  };
}
