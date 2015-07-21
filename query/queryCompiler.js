/**
 * Created by austin on 3/31/15.
 */

"use strict";

var _ = require("lodash")

  , formatter = require("../formatter")
  , components = require("../componentDeclarations/components")
  , methods = require("../componentDeclarations/componentCompilerMethods")[components.query];

var component = components.query;

module.exports = {
  insert: function () {
    return this._wrapMethod(component, "insert", _getInsert(), arguments);
  },
  select: function () {
    return this._wrapMethod(component, "select", _getSelect(), arguments);
  },
  update: function () {
    return this._wrapMethod(component, "update", _getUpdate(), arguments);
  },
  delete: function () {
    return this._wrapMethod(component, "delete", _getDelete(), arguments);
  }
};

function _getInsert() {
  return function (values) {

    var compileOptions = {};
    if (values) {
      compileOptions.identifiers = [];
      compileOptions.values = [];
      _.each(values, function (v, k) {
        compileOptions.identifiers.push(formatter.wrapQuotes(k));
        compileOptions.values.push(v);
      });
    }
    var compiling = this.getCompiling("insert", compileOptions);

    var source = _getSource(this)
      , insertStatement = "INSERT INTO " + source + " (" + _.toArray(compiling.value.identifiers).join(",") + ") VALUES "
      , cql = insertStatement;

    cql += "(" + formatter.parameterize(compiling.value.values, this) + ")";
    if (_.has(this._grouped, "using")) {
      cql += " " + _compileUsing(this, this._grouped.using);
    }

    this.query({
      cql: cql + ";"
    });

    return this;
  };
}

function _getSelect() {
  return function () {

    var columns = []
      , argArray = _.toArray(arguments);
    if (!argArray.length) {
      columns.push("*");
    }
    else if (_.isArray(argArray[0])) {
      columns = argArray[0];
    }
    else {
      columns = argArray;
    }

    var compiling = this.getCompiling("select", {columns: columns})
      , columnStatements = _.map(compiling.value.columns, function (column) {
        if (_.isObject(column)) {
          var key = Object.keys(column)[0];
          return formatter.wrapQuotes(key) + " AS " + formatter.wrapQuotes(column[key]);
        }
        else {
          if (column !== column) {
            return formatter.wrapQuotes(column);
          }
          else {
            return column;
          }
        }
      })
      , selectStatement = "SELECT " + columnStatements.join(",") + " "
      , source = _getSource(this)
      , cql = selectStatement + "FROM " + source;

    if (_.has(this._grouped, "where")) {
      cql += " WHERE " + _compileWhere(this, this._grouped.where);
    }
    if (_.has(this._single, "limit")) {
      cql += " LIMIT " + formatter.parameterize(this._single.limit.limit, this);
    }
    if (_.has(this._single, "allowFiltering") && this._single.allowFiltering.allow) {
      cql += " ALLOW FILTERING";
    }

    this.query({
      cql: cql + ";"
    });

    return this;
  };
}

function _getUpdate() {
  return function (columnFamily) {

    var compiling = this.getCompiling("update", {
      columnFamily: columnFamily
    });

    if (compiling.value.columnFamily) {
      this._setColumnFamily(compiling.value.columnFamily);
    }

    var source = _getSource(this)
      , insertStatement = "UPDATE " + source
      , cql = insertStatement;

    if (_.has(this._grouped, "set")) {
      cql += " SET " + _compileSet(this, this._grouped.set);
    }
    if (_.has(this._grouped, "where")) {
      cql += " WHERE " + _compileWhere(this, this._grouped.where);
    }

    this.query({
      cql: cql + ";"
    });

    return this;
  };
}

function _getDelete() {
  return function () {

    var compiling = this.getCompiling("delete", {
      columns: _.flatten(_.toArray(arguments))
    });

    var source = _getSource(this)
      , deleteStatement = "DELETE " + _.map(compiling.value.columns, function (col) {
          return formatter.wrapQuotes(col);
        }).join(",") + " FROM " + source
      , cql = deleteStatement;

    if (_.has(this._grouped, "where")) {
      cql += " WHERE " + _compileWhere(this, this._grouped.where);
    }

    this.query({
      cql: cql + ";"
    });

    return this;
  };
}

function _getSource(client) {
  return (
    client._keyspace && client._columnFamily ? [formatter.wrapQuotes(client._keyspace), formatter.wrapQuotes(client._columnFamily)].join(".") :
      (client._columnFamily ? formatter.wrapQuotes(client._columnFamily) : "")
  )
}

// helper compilers

function _compileWhere(client, whereStatements) {

  var groupedWhere = _.groupBy(whereStatements, "type");
  var cql = ""
    , relationsStart = true;
  _.each(Object.keys(groupedWhere), function (type) {
    var relations = [];
    relations.length = 0;
    _.each(groupedWhere[type], function (statement) {
      var key = statement.key;
      // test for nested columns
      if ((/\[.*\]$/).test(key)) {
        key = formatter.wrapQuotes(key.replace(/\[.*/g, "")) + key.replace(/.+?(?=\[)/, "");
      }
      else {
        key = formatter.wrapQuotes(key);
      }
      switch (statement.op.toLowerCase()) {
        case "in":
          relations.push([key, statement.op, "(" + formatter.parameterize(statement.val, client) + ")"].join(" "));
          break;
        default:
          relations.push([key, statement.op, formatter.parameterize(statement.val, client)].join(" "));
      }
    });

    var joinClause = " AND ";
    if (type === "orWhere")
      joinClause = " OR ";
    if (type === "whereRaw")
      joinClause = " ";

    cql += (!relationsStart ? joinClause : "") + relations.join(joinClause);
    relationsStart = false;
  });

  return cql;
}

function _compileSet(client, setStatements) {

  var cql = ""
    , assignments = [];

  _.each(setStatements, function (statement) {
    var key = formatter.wrapQuotes(statement.key);
    if (!_.isArray(statement.val)) {
      assignments.push(key + " = " + formatter.parameterize(statement.val, client));
    }
    else {
      assignments.push(key + " = " + formatter.parameterizeArray(statement.val, client));
    }
  });
  cql += assignments.join(",");

  return cql;
}

function _compileUsing(client, usingStatements) {

  var cql = ""
    , using = [];

  _.each(usingStatements, function (statement) {
    var statementString = "USING ";
    if (statement.type === "usingTTL")
      statementString += "TTL ";
    if (statement.type === "usingTimestamp")
      statementString += "TIMESTAMP ";

    using.push(statementString + formatter.parameterize(statement.val, client));
  });

  cql += using.join(" AND ");

  return cql;
}
