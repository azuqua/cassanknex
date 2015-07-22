/**
 * Created by austin on 4/29/15.
 */

"use strict";

var _ = require("lodash")

  , formatter = require("../formatter")
  , components = require("../componentDeclarations/components")
  , methods = require("../componentDeclarations/componentCompilerMethods")[components.columnFamily]
  , builderMethods = require("../componentDeclarations/componentBuilderMethods")[components.columnFamily];

var component = components.columnFamily;

module.exports = {
  createColumnFamily: function () {
    if (arguments.length === 1) {
      arguments[1] = null; // set stand in keyspace value
    }
    arguments[2] = false;
    arguments.length = 3;
    return this._wrapMethod(component, "createColumnFamily", _getCreateColumnFamily(), arguments);
  },
  createType: function () {
    if (arguments.length === 1) {
      arguments[1] = null; // set stand in keyspace value
    }
    arguments[2] = false;
    arguments.length = 3;
    return this._wrapMethod(component, "createType", _getCreateType(), arguments);
  },
  createColumnFamilyIfNotExists: function () {
    if (arguments.length === 1) {
      arguments[1] = null; // set stand in keyspace value
    }
    arguments[2] = true;
    arguments.length = 3;
    return this._wrapMethod(component, "createColumnFamily", _getCreateColumnFamily(), arguments);
  },
  createTypeIfNotExists: function () {
    if (arguments.length === 1) {
      arguments[1] = null; // set stand in keyspace value
    }
    arguments[2] = true;
    arguments.length = 3;
    return this._wrapMethod(component, "createType", _getCreateType(), arguments);
  },
  alterColumnFamily: function () {
    if (arguments.length === 1) {
      arguments[1] = null; // set stand in keyspace value
    }
    arguments.length = 2;
    return this._wrapMethod(component, "alterColumnFamily", _getAlterColumnFamily(), arguments);
  },
  alterType: function () {
    if (arguments.length === 1) {
      arguments[1] = null; // set stand in keyspace value
    }
    arguments.length = 2;
    return this._wrapMethod(component, "alterType", _getAlterType(), arguments);
  },

  createIndex: function () {
    return this._wrapMethod(component, "createIndex", _getCreateIndex(), arguments);
  },
  dropColumnFamily: function () {
    if (arguments.length === 1) {
      arguments[1] = null; // set stand in keyspace value
    }
    arguments[2] = false;
    arguments.length = 3;
    return this._wrapMethod(component, "dropColumnFamily", _getDropColumnFamily(), arguments);
  },
  dropType: function () {
    if (arguments.length === 1) {
      arguments[1] = null; // set stand in keyspace value
    }
    arguments[2] = false;
    arguments.length = 3;
    return this._wrapMethod(component, "dropType", _getDropType(), arguments);
  },
  dropColumnFamilyIfExists: function () {
    if (arguments.length === 1) {
      arguments[1] = null; // set stand in keyspace value
    }
    arguments[2] = true;
    arguments.length = 3;
    return this._wrapMethod(component, "dropColumnFamilyIfExists", _getDropColumnFamily(), arguments);
  },
  dropTypeIfExists: function () {
    if (arguments.length === 1) {
      arguments[1] = null; // set stand in keyspace value
    }
    arguments[2] = true;
    arguments.length = 3;
    return this._wrapMethod(component, "dropTypeIfExists", _getDropType(), arguments);
  }
};

function _getCreateColumnFamily() {

  return function (columnFamily, keyspace, ifNot) {

    var compiling = this.getCompiling("createColumnFamily", {
      keyspace: keyspace,
      columnFamily: columnFamily,
      ifNot: ifNot
    });

    if (compiling.value.columnFamily)
      this._setColumnFamily(compiling.value.columnFamily);
    if (compiling.value.keyspace)
      this._setKeyspace(compiling.value.keyspace);

    var createStatement = compiling.value.ifNot ? "CREATE COLUMNFAMILY IF NOT EXISTS " : "CREATE COLUMNFAMILY "
      , cql = createStatement + [formatter.wrapQuotes(this.keyspace()), formatter.wrapQuotes(this.columnFamily())].join(".") + " ";

    cql += _compileColumns(this);
    cql += _compileWith(this);

    cql += ";";
    this.query({
      cql: cql
    });

    return this;
  };

}

function _getCreateType() {

  return function (columnFamily, keyspace, ifNot) {

    var compiling = this.getCompiling("createType", {
      keyspace: keyspace,
      columnFamily: columnFamily,
      ifNot: ifNot
    });

    if (compiling.value.columnFamily)
      this._setColumnFamily(compiling.value.columnFamily);
    if (compiling.value.keyspace)
      this._setKeyspace(compiling.value.keyspace);

    var createStatement = compiling.value.ifNot ? "CREATE TYPE IF NOT EXISTS " : "CREATE TYPE "
      , cql = createStatement + [formatter.wrapQuotes(this.keyspace()), this.columnFamily()].join(".") + " ";

    cql += _compileColumns(this);
    cql += _compileWith(this);

    cql += ";";
    this.query({
      cql: cql
    });

    return this;
  };

}

function _getAlterColumnFamily() {

  return function (columnFamily, keyspace) {

    var compiling = this.getCompiling("alterColumnFamily", {
      keyspace: keyspace,
      columnFamily: columnFamily
    });

    if (compiling.value.columnFamily)
      this._setColumnFamily(compiling.value.columnFamily);
    if (compiling.value.keyspace)
      this._setKeyspace(compiling.value.keyspace);

    var alterStatement = "ALTER TABLE "
      , cql = alterStatement + [formatter.wrapQuotes(this.keyspace()), formatter.wrapQuotes(this.columnFamily())].join(".") + " ";

    if (_.has(this._grouped, "column")) {
      cql += "ADD " + _compileColumns(this, " ADD ", false);
    }
    cql += _compileWith(this);
    cql += _compileAlter(this);

    cql += ";";
    this.query({
      cql: cql
    });

    return this;
  };
}

function _getAlterType() {

  return function (columnFamily, keyspace) {

    var compiling = this.getCompiling("alterType", {
      keyspace: keyspace,
      columnFamily: columnFamily
    });

    if (compiling.value.columnFamily)
      this._setColumnFamily(compiling.value.columnFamily);
    if (compiling.value.keyspace)
      this._setKeyspace(compiling.value.keyspace);

    var alterStatement = "ALTER TYPE "
      , cql = alterStatement + [formatter.wrapQuotes(this.keyspace()), this.columnFamily()].join(".") + " ";

    if (_.has(this._grouped, "column")) {
      cql += "ADD " + _compileColumns(this, " ADD ", false);
    }
    cql += _compileWith(this);
    cql += _compileAlter(this);

    cql += ";";
    this.query({
      cql: cql
    });

    return this;
  };
}

function _getCreateIndex() {

  return function (columnFamily, indexName, onColumn) {

    var compiling = this.getCompiling("createIndex", {
      columnFamily: columnFamily,
      indexName: indexName,
      onColumn: onColumn
    });

    if (compiling.value.columnFamily)
      this._setColumnFamily(compiling.value.columnFamily);

    var createStatement = "CREATE INDEX"
      , cql = [createStatement, compiling.value.indexName, "ON"].join(" ") +
        " " + [formatter.wrapQuotes(this.keyspace()), formatter.wrapQuotes(this.columnFamily())].join(".") +
        " " + ["(", formatter.wrapQuotes(compiling.value.onColumn), ")"].join(" ");

    cql += ";";
    this.query({
      cql: cql
    });

    return this;
  };
}

function _getDropColumnFamily() {

  return function (columnFamily, keyspace, ifNot) {

    var compiling = this.getCompiling("dropColumnFamily", {
      keyspace: keyspace,
      columnFamily: columnFamily,
      ifNot: ifNot
    });

    if (compiling.value.columnFamily)
      this._setColumnFamily(compiling.value.columnFamily);
    if (compiling.value.keyspace)
      this._setKeyspace(compiling.value.keyspace);

    var dropStatement = compiling.value.ifNot ? "DROP COLUMNFAMILY IF EXISTS " : "DROP COLUMNFAMILY "
      , cql = dropStatement + [formatter.wrapQuotes(this.keyspace()), formatter.wrapQuotes(this.columnFamily())].join(".") + " ";

    cql += ";";
    this.query({
      cql: cql
    });

    return this;
  };

}

function _getDropType() {

  return function (columnFamily, keyspace, ifNot) {

    var compiling = this.getCompiling("dropType", {
      keyspace: keyspace,
      columnFamily: columnFamily,
      ifNot: ifNot
    });

    if (compiling.value.columnFamily)
      this._setColumnFamily(compiling.value.columnFamily);
    if (compiling.value.keyspace)
      this._setKeyspace(compiling.value.keyspace);

    var dropStatement = compiling.value.ifNot ? "DROP TYPE IF EXISTS " : "DROP TYPE "
      , cql = dropStatement + [formatter.wrapQuotes(this.keyspace()), this.columnFamily()].join(".") + " ";

    cql += ";";
    this.query({
      cql: cql
    });

    return this;
  };

}

function _compileColumns(client, deliminator, wrap) {

  var statement = "";
  if (_.has(client._grouped, "column")) {
    var columns = [];

    deliminator = deliminator || ", ";
    wrap = typeof wrap !== "undefined" ? wrap : true;

    _.each(client._grouped.column, function (column) {
      switch (column.jsType) {
        case "bigDecimal":
        case "boolean":
        case "buffer":
        case "date":
        case "inetAddress":
        case "long":
        case "number":
        case "string":
          columns.push([formatter.wrapQuotes(column.name), column.type.toUpperCase()].join(" "));
          break;

        case "array":
        case "object":
          // handle the frozen set, map and list columns
          if (column.type === builderMethods.frozenSet.name) {
            columns.push([formatter.wrapQuotes(column.name), "SET", "<" + "FROZEN", "<" + column.options.join(",") + ">>"].join(" "));
          }
          else if (column.type === builderMethods.frozenMap.name) {
            columns.push([formatter.wrapQuotes(column.name), "MAP", "<" + column.options[0] + ", FROZEN <" + column.options[1] + ">>"].join(" "));
          }
          else if (column.type === builderMethods.frozenList.name) {
            columns.push([formatter.wrapQuotes(column.name), "LIST", "<FROZEN", "<" + column.options[0] + ">>"].join(" "));
          }
          // general (non UUDT or frozen) case
          else {
            columns.push([formatter.wrapQuotes(column.name), column.type.toUpperCase(), "<" + column.options.join(",") + ">"].join(" "));
          }
          break;

        case "PRIMARY_KEY":
          var keyStatements = _.map(column.options, function (option) {
            return (_.isArray(option) ? "(" + _.map(option, function (op) {
              return formatter.wrapQuotes(op);
            }).join(", ") + ")" : formatter.wrapQuotes(option));
          });
          columns.push("PRIMARY KEY (" + keyStatements.join(", ") + ")");
          break;
        default:
          console.error("Unrecognized column jsType: " + column.jsType);
      }
    });

    if (wrap)
      statement = "( " + columns.join(deliminator) + " ) ";
    else
      statement = columns.join(deliminator);
  }

  return statement;
}

function _compileWith(client) {

  var cql = "";
  if (_.has(client._grouped, "with")) {
    var statements = [];
    _.each(client._grouped.with, function (withStatement) {
      if (withStatement.type !== "clustering") {
        statements.push(withStatement.type + " = " + formatter.toMapString(withStatement.value));
      }
      else {
        statements.push([
          withStatement.type.toUpperCase(),
          "ORDER BY",
          "(",
          formatter.wrapQuotes(withStatement.args[0]),
          String(withStatement.args[1]).toUpperCase(),
          ")",
          ""
        ].join(" "));
      }
    });
    cql = "WITH " + statements.join(" AND ");
  }

  return cql;
}

function _compileAlter(client) {

  var cql = "";
  if (_.has(client._grouped, "alter")) {
    var statements = [];
    _.each(client._grouped.alter, function (alterStatement) {

      var options = alterStatement.options;
      switch (alterStatement.type) {
        case "alter":
          statements.push("ALTER " + formatter.wrapQuotes(options[0]) + " TYPE " + options[1]);
          break;
        case "drop":
          statements.push("DROP " + _.map(options, function (op) {
              return formatter.wrapQuotes(op);
            }).join(" DROP "));
          break;
        case "rename":
          statements.push("RENAME " + formatter.wrapQuotes(options[0]) + " TO " + formatter.wrapQuotes(options[1]));
          break;
      }
    });
    cql = statements.join(" ");
  }

  return cql;
}
