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
    if (_.has(this._single, "ifNotExists")) {
      cql += " IF NOT EXISTS";
    }
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
      , argArray = _.toArray(arguments)
      , hasAggregates = _.has(this._grouped, "aggregate");
    if (!argArray.length && !hasAggregates) {
      columns.push("*");
    }
    else if (_.isArray(argArray[0])) {
      columns = argArray[0];
    }
    else {
      columns = argArray;
    }

    var compiling = this.getCompiling("select", {columns: columns});
    if (hasAggregates && compiling.value.columns.length === 1 && compiling.value.columns[0] === "*") {
      // retroactively remove "*"
      compiling.value.columns.length = 0;
    }
    var columnStatements = _.map(compiling.value.columns, function (column) {
        if (_.isObject(column)) {
          var key = Object.keys(column)[0];
          return formatter.wrapQuotes(key) + " AS " + formatter.wrapQuotes(column[key]);
        }
        else {
          if (column !== "*") {
            return formatter.wrapQuotes(column);
          }
          else {
            return column;
          }
        }
      })
      , source = _getSource(this);

    var cql = "SELECT " + columnStatements.join(",");

    if (_.has(this._grouped, "aggregate")) {
      _.each(this._grouped.aggregate, function (aggregate) {
        // TODO add.. more.. aggregates
        switch (aggregate.type) {
          case "dateOf":
          case "unixTimestampOf":
          case "toDate":
          case "toTimestamp":
          case "toUnixTimestamp":
          case "writetime":
          case "ttl":
            var key, val;
            if (_.isObject(aggregate.val)) {
              key = Object.keys(aggregate.val)[0];
              val = aggregate.val[key];
            }
            else {
              key = aggregate.val;
            }
            cql += (columnStatements.length ? ", " : "") +
              aggregate.type + "(" + formatter.wrapQuotes(key) + ")" +
              (val ? " AS " + formatter.wrapQuotes(val) : "");
            break;
          case "count":
            var key, val;
            if (_.isObject(aggregate.val)) {
              key = Object.keys(aggregate.val)[0];
              val = aggregate.val[key];
            }
            else {
              key = aggregate.val;
            }
            cql += (columnStatements.length ? ", " : "") +
              "COUNT(" + (key === "*" ? "*" : formatter.wrapQuotes(key)) + ")" +
              (val ? " AS " + formatter.wrapQuotes(val) : "");
            break;
        }
      });
    }
    cql += " FROM " + source;

    if (_.has(this._grouped, "where")) {
      cql += " WHERE " + _compileWhere(this, this._grouped.where);
    }
    if (_.has(this._grouped, "orderBy")) {
      cql += " ORDER BY " + _compileOrder(this, this._grouped.orderBy);
    }
    if (_.has(this._single, "limit") && this._single.limit.type === "limit") {
      cql += " LIMIT " + formatter.parameterize(this._single.limit.limit, this);
    }
    if (_.has(this._single, "limit") && this._single.limit.type === "limitPerPartition") {
      cql += " PER PARTITION LIMIT " + formatter.parameterize(this._single.limit.limit, this);
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

    if (_.has(this._grouped, "using")) {
      cql += " " + _compileUsing(this, this._grouped.using);
    }
    if (_.has(this._grouped, "set")) {
      cql += " SET " + _compileSet(this, this._grouped.set);
    }
    if (_.has(this._grouped, "where")) {
      cql += " WHERE " + _compileWhere(this, this._grouped.where);
    }
    if (_.has(this._grouped, "if")) {
      cql += " IF " + _compileIf(this, this._grouped.if);
    }
    if (_.has(this._single, "ifExists")) {
      cql += " IF EXISTS";
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
    if (_.has(this._grouped, "if")) {
      cql += " IF " + _compileIf(this, this._grouped.if);
    }
    if (_.has(this._single, "ifExists")) {
      cql += " IF EXISTS";
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
      var value = formatter.parameterize(statement.val, client);
      if ((/\[.*\]$/).test(key)) { // test for nested columns
        key = formatter.wrapQuotes(key.replace(/\[.*/g, "")) + key.replace(/.+?(?=\[)/, "");
      }
      else if (Array.isArray(key)) {
        key = '"' + key.join('", "') + '"';
      }
      else {
        key = formatter.wrapQuotes(key);
      }
      if (type === "tokenWhere") {
        key = 'TOKEN(' + key + ')';
        value = 'TOKEN(' + value + ')';
      } else if (type === "minTimeuuidWhere") {
        value = 'minTimeuuid(' + value + ')';
      } else if (type === "maxTimeuuidWhere") {
        value = 'maxTimeuuid(' + value + ')';
      }
      switch (statement.op.toLowerCase()) {
        case "in":
          relations.push([key, statement.op, "(" + value + ")"].join(" "));
          break;
        default:
          relations.push([key, statement.op, value].join(" "));
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

function _compileIf(client, whereStatements) {

  var groupedIf = _.groupBy(whereStatements, "type");
  var cql = ""
    , relationsStart = true;
  _.each(Object.keys(groupedIf), function (type) {
    var relations = [];
    relations.length = 0;
    _.each(groupedIf[type], function (statement) {
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
    switch (statement.type) {
      case "set":
        if (!_.isArray(statement.val)) {
          assignments.push(key + " = " + formatter.parameterize(statement.val, client));
        }
        else {
          assignments.push(key + " = " + formatter.parameterizeArray(statement.val, client));
        }
        break;
      case "add":
        assignments.push(key + " = " + key + (statement.type === "add" ? " + " : " - ") + formatter.parameterize(statement.val, client));
        break;
      case "remove":
        assignments.push(key + " = " + key + (statement.type === "add" ? " + " : " - ") + formatter.parameterizeArray(statement.val, client));
        break;
      case "increment":
      case "decrement":
        assignments.push(key + " = " + key + (statement.type === "increment" ? " + " : " - ") + formatter.parameterize(statement.val, client));
        break;
    }
  });
  cql += assignments.join(",");

  return cql;
}

function _compileUsing(client, usingStatements) {

  var cql = ""
    , using = [];

  _.each(usingStatements, function (statement) {
    var statementString = using.length ? "" : "USING ";
    if (statement.type === "usingTTL")
      statementString += "TTL ";
    if (statement.type === "usingTimestamp")
      statementString += "TIMESTAMP ";

    using.push(statementString + formatter.parameterize(statement.val, client));
  });

  cql += using.join(" AND ");

  return cql;
}

function _compileOrder(client, orderByStatements) {

  var cql = ""
    , orderBy = [];

  _.each(_.map(orderByStatements, "orderBy"), function (statement) {
    orderBy.push(formatter.wrapQuotes(statement.column) + " " + statement.order);
  });

  cql += orderBy.join(" ");

  return cql;
}
