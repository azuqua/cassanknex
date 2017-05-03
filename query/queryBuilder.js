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
    case "aggregate":
      queryBuilder[method] = function () {
        return this._wrapMethod(null, methods[method].name, _getAggregate(methods[method].name), arguments);
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
    case "allow":
      queryBuilder[method] = function () {
        return this._wrapMethod(null, methods[method].name, _getAllowFiltering(methods[method].name), arguments);
      };
      break;
    case "orderBy":
      queryBuilder[method] = function () {
        return this._wrapMethod(null, methods[method].name, _getOrderBy(methods[method].name), arguments);
      };
      break;
    case "ifNotExists":
      queryBuilder[method] = function () {
        return this._wrapMethod(null, methods[method].name, _getIfNotExists(methods[method].name), arguments);
      };
      break;
    case "ifExists":
      queryBuilder[method] = function () {
        return this._wrapMethod(null, methods[method].name, _getIfExists(methods[method].name), arguments);
      };
      break;
    case "if":
      queryBuilder[method] = function () {
        return this._wrapMethod(null, methods[method].name, _getIf(methods[method].name), arguments);
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

function _getAggregate(type) {
  return function (value) {

    var statement = {
      grouping: "aggregate",
      type: type,
      val: value
    };
    this._statements.push(statement);

    return this;
  }
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

    // object type 'set' called => .set(<Object> := {<String>: <Mixed>, ...})
    if (_.isObject(identifier)) {
      var self = this;
      _.each(identifier, function (value, identifier) {

        var statement = {
          grouping: "set",
          type: type,
          key: identifier,
          val: value
        };
        self._statements.push(statement);
      });
    }
    // simple 'set' called => .set(<String>, <Mixed>)
    else {
      var statement = {
        grouping: "set",
        type: type,
        key: identifier,
        val: value
      };
      this._statements.push(statement);
    }

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

function _getIfNotExists() {
  return function () {
    this._single.ifNotExists = {grouping: "ifNotExists", ifNotExists: true};

    return this;
  };
}

function _getIfExists() {
  return function () {
    this._single.ifExists = {grouping: "ifExists", ifExists: true};

    return this;
  };
}

function _getLimit(type) {
  return function (limit) {
    this._single.limit = {grouping: "limit", type: type, limit: limit};

    return this;
  };
}

function _getAllowFiltering() {
  return function () {
    this._single.allowFiltering = {grouping: "allow", allow: true};

    return this;
  };
}

function _getOrderBy() {
  return function () {

    var order
      , statements = [];

    if (arguments.length === 2) {
      order = {
        column: arguments[0],
        order: (typeof arguments[1] === "string" ? arguments[1].toUpperCase() : arguments[1])
      };
      statements.push({grouping: "orderBy", orderBy: order});
    }
    else {
      statements = _.map(_.isObject(arguments[0]) ? arguments[0] : {}, function (v, k) {
        order = {
          column: k,
          order: (typeof v === "string" ? v.toUpperCase() : v)
        };
        return {grouping: "orderBy", orderBy: order};
      });
    }

    this._statements = this._statements.concat(statements);
    return this;
  }
}

function _getIf(type) {
  return function (identifier, op, value) {

    var statement = {
      grouping: "if",
      type: type,
      op: op,
      key: identifier,
      val: value
    };
    this._statements.push(statement);

    return this;
  };
}