/**
 * Created by austin on 3/29/15.
 */

"use strict";

var _ = require("lodash")

  , formatter = require("../formatter")
  , components = require("../componentDeclarations/components")
  , methods = require("../componentDeclarations/componentCompilerMethods")[components.keyspace];

var component = components.keyspace;

module.exports = {
  createKeyspace: function () {
    arguments[1] = false;
    arguments.length = 2;
    return this._wrapMethod(component, "createKeyspace", _getCreateKeyspace(), arguments);
  },
  createKeyspaceIfNotExists: function () {
    arguments[1] = true;
    arguments.length = 2;
    return this._wrapMethod(component, "createKeyspaceIfNotExists", _getCreateKeyspace(), arguments);
  },
  alterKeyspace: function () {
    arguments[1] = false;
    arguments.length = 2;
    return this._wrapMethod(component, "alterKeyspace", _getAlterKeyspace(), arguments);
  },
  alterKeyspaceIfExists: function () {
    arguments[1] = true;
    arguments.length = 2;
    return this._wrapMethod(component, "alterKeyspace", _getAlterKeyspace(), arguments);
  },
  dropKeyspace: function () {
    arguments[1] = false;
    arguments.length++;
    return this._wrapMethod(component, "dropKeyspace", _getDropKeyspace(), arguments);
  },
  dropKeyspaceIfExists: function () {
    arguments[1] = true;
    arguments.length = 2;
    return this._wrapMethod(component, "dropKeyspaceIfExists", _getDropKeyspace(), arguments);
  },
  keyspaceName: function () {
    return this._keyspace;
  }
};

function _getCreateKeyspace() {

  return function (keyspace, ifNot) {

    var compiling = this.getCompiling("createKeyspace", {keyspace: keyspace, ifNot: ifNot});
    if (compiling.value.keyspace)
      this.use(compiling.value.keyspace);

    var createStatement = compiling.value.ifNot ? "CREATE KEYSPACE IF NOT EXISTS " : "CREATE KEYSPACE "
      , cql = createStatement + formatter.wrapQuotes(this.keyspaceName());

    cql += _compileStrategy(this);
    cql += _compileAnd(this);

    cql += ";";
    this.query({
      cql: cql
    });

    return this;
  };
}

function _getAlterKeyspace() {

  return function (keyspace, _if) {

    var compiling = this.getCompiling("alterKeyspace", {keyspace: keyspace, if: _if});
    if (compiling.value.keyspace)
      this.use(compiling.value.keyspace);

    var createStatement = compiling.value.if ? "ALTER KEYSPACE IF EXISTS " : "ALTER KEYSPACE "
      , cql = createStatement + formatter.wrapQuotes(this.keyspaceName());

    cql += _compileStrategy(this);
    cql += _compileAnd(this);

    cql += ";";
    this.query({
      cql: cql
    });

    return this;
  };
}

function _getDropKeyspace() {
  return function (keyspace, _if) {

    var compiling = this.getCompiling("dropKeyspace", {keyspace: keyspace, if: _if});
    if (compiling.value.keyspace)
      this.use(compiling.value.keyspace);

    var dropStatement = compiling.value.if ? "DROP KEYSPACE IF EXISTS " : "DROP KEYSPACE "
      , cql = dropStatement + formatter.wrapQuotes(this.keyspaceName());

    cql += ";";
    this.query({
      cql: cql
    });

    return this;
  };
}

function _compileStrategy(client) {

  var cql = "";
  if (_.has(client._grouped, "strategy")) {
    cql += " WITH REPLICATION = ";
    _.each(client._grouped.strategy, function (strategy) {
      cql += formatter.toMapString(strategy.value);
    });
  }

  return cql;
}

function _compileAnd(client) {

  var cql = "";
  if (_.has(client._grouped, "and")) {
    cql += " AND ";
    _.each(client._grouped.and, function (and) {
      cql += and.type + " = " + and.value;
    });
  }

  return cql;
}