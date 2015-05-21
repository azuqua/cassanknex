/**
 * Created by austin on 4/29/15.
 */

"use strict";

var _ = require("lodash")

  , components = require("../componentDeclarations/components")
  , methods = require("../componentDeclarations/componentBuilderMethods")[components.columnFamily]

  , reservedWords = require("./reservedWords.json");

var nameToCallMap = {};
_.each(Object.keys(methods), function (method) {
  nameToCallMap[methods[method].name] = method;
});

var columnFamilyBuilder = {};

_.each(Object.keys(methods), function (method) {
  switch (methods[method].grouping) {
    case "column":
      columnFamilyBuilder[method] = function () {
        return this._wrapMethod(null, method, _getColumn(method, methods[method].jsType), arguments);
      };
      break;
    case "with":
      columnFamilyBuilder[method] = function () {
        return this._wrapMethod(null, method, _getWith(methods[method].name), arguments);
      };
      break;
    case "alter":
      columnFamilyBuilder[method] = function () {
        return this._wrapMethod(null, method, _getAlter(methods[method].name), arguments);
      };
      break;
  }
});

function _getColumn(type, jsType) {
  return function (name) {

    if (reservedWords[String(name).toLowerCase()]) {
      console.warn("WARNING! '%s' is a reserved word in CQL!", name);
    }

    var statement = {
      grouping: "column",
      type: type,
      jsType: jsType,
      name: name,
      options: (jsType !== "PRIMARY_KEY" ? _.toArray(arguments).slice(1) : _.toArray(arguments))
    };
    this._statements.push(statement);

    return this;
  };
}

function _getWith(type) {
  return function (options) {

    var statement = {
      grouping: "with",
      type: type,
      value: options,
      args: _.toArray(arguments)
    };
    this._statements.push(statement);

    return this;
  };
}

function _getAlter(type) {
  return function () {

    var statement = {
      grouping: "alter",
      type: type,
      options: _.toArray(arguments)
    };
    this._statements.push(statement);

    return this;
  };
}

module.exports = columnFamilyBuilder;
