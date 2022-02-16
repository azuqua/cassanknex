/**
 * Created by austin on 3/29/15.
 */

'use strict';

var _ = require("lodash")
  , inherits = require("inherits")
  , EventEmitter = require('events').EventEmitter

  , componentBuilderMethods = require("./componentDeclarations/componentBuilderMethods")
  , componentMethods = require("./componentDeclarations/componentCompilerMethods")
  , components = require("./componentDeclarations/components");

var builderMethods = []
  , compilerMethods = [];

_.each(components, function (component) {
  if (componentBuilderMethods[component]) {
    var bm_diff = _.difference(Object.keys(componentBuilderMethods[component]), builderMethods);
    builderMethods = builderMethods.concat(bm_diff);
  }
  if (componentMethods[component]) {
    var cm_diff = _.difference(Object.keys(componentMethods[component]), compilerMethods);
    compilerMethods = compilerMethods.concat(cm_diff);
  }
});

var keyspaceBuilder = null
  , keyspaceCompiler = require("./schema/keyspaceCompiler")

  , columnFamilyBuilder = null
  , columnFamilyCompiler = require("./schema/columnFamilyCompiler")

  , queryBuilder = null
  , queryCompiler = require("./query/queryCompiler");

function Client(config) {
  var self = this;

  this._debug = config.debug ? config.debug : false;
  this._awsKeyspace = config.awsKeyspace ? config.awsKeyspace : false;
  if (config.connection) {
    this._connectionSettings = config.connection;
  }

  this._dialect = "cql";
  this._exec = _.has(config, "exec") ? config.exec : {};
  this._execPrepare = (_.has(this._exec, "prepare") ? this._exec.prepare : true);
  this._keyspace = null;
  this._columnFamily = null;
  this._methodStack = [];
  this._queryPhases = [];
  this._cql = null;
  this._bindings = [];
  this._statements = [];
  this._single = {};
  this._grouped = {};
  this._executing = false;
  this._isCompiling = false;
  this._compileMethod = null;
}

inherits(Client, EventEmitter);

// compiler methods live at the top level
_.each(keyspaceCompiler, function (v, k) {
  Client.prototype[k] = function () {
    return keyspaceCompiler[k].apply(this, arguments);
  };
});
_.each(columnFamilyCompiler, function (v, k) {
  Client.prototype[k] = function () {
    return columnFamilyCompiler[k].apply(this, arguments);
  };
});
_.each(queryCompiler, function (v, k) {
  Client.prototype[k] = function () {
    return queryCompiler[k].apply(this, arguments);
  };
});

_.each(builderMethods, function (method) {
  Client.prototype[method] = function () {

    var _arguments = arguments
      , self = this;
    if (this._component === components.keyspace) { // compiling a keyspace schema query statement
      if (!keyspaceBuilder)
        self._initKeyspaceBuilder();
      return (function () {
        keyspaceBuilder[method].apply(self, _arguments);
        if (self.debug()) {
          self._checkCompile();
        }
        return self;
      })();
    }
    else if (this._component === components.columnFamily) { // compiling a column family schema query statement
      if (!columnFamilyBuilder)
        self._initColumnFamilyBuilder();
      return (function () {
        columnFamilyBuilder[method].apply(self, _arguments);
        if (self.debug()) {
          self._checkCompile();
        }
        return self;
      })();
    }
    else {// assume we're going to compile a basic query
      if (!queryBuilder)
        self._initQueryBuilder();
      return (function () {
        queryBuilder[method].apply(self, _arguments);
        if (self.debug()) {
          self._checkCompile();
        }
        return self;
      })();
    }
  };
});

// compile and return the cql statement
Client.prototype.cql = function () {
  this._setExecuting(true);
  this._checkCompile();

  this._debugLog();
  return this._cql;
};

// get the current keyspace in use
Client.prototype.keyspace = function () {
  return this._keyspace;
};

// get the current debug value
Client.prototype.debug = function () {
  return this._debug;
};

// get the current aws keyspaces value
Client.prototype.awsKeyspace = function () {
  return this._awsKeyspace;
};

// get the current executing value
Client.prototype.executing = function () {
  return this._executing;
};

// external set the keyspace (for users)
Client.prototype.use = function (keyspace) {
  this._setKeyspace(keyspace);
};

// internal set the keyspace (for clarity)
Client.prototype._setKeyspace = function (keyspace) {
  this._keyspace = keyspace;
};

// internal set executing (for clarity)
Client.prototype._setExecuting = function (executing) {
  this._executing = executing;
};

// get the current columnFamily in use
Client.prototype.columnFamily = function () {
  return this._columnFamily;
};

// get the current columnFamily in use
Client.prototype._setColumnFamily = function (columnFamily) {
  this._columnFamily = columnFamily;
};

// get the current compiled bindings array
Client.prototype.bindings = function () {
  return this._bindings;
};

// set the component
Client.prototype.component = function (component) {
  this._component = component;
};

// set the compiling method and flag
Client.prototype.compiling = function (method) {
  if (method) {
    this._isCompiling = true;
    this._compileMethod = method;
  }
  else {
    this._isCompiling = false;
    this._compileMethod = null;
  }
};

// get the compiling options first set by a call to an interface (top level) method
Client.prototype.getCompiling = function (method, params) {
  var compiling;
  if (!_.has(this._grouped, "compiling")) {
    compiling = {
      grouping: "compiling",
      type: method,
      value: {}
    };
    _.each(params || {}, function (v, k) {
      compiling.value[k] = v;
    });
    this._statements.push(compiling);
    this.compiling(method);
  }
  else
    compiling = this._grouped.compiling[0];
  return compiling;
};

// set the method
Client.prototype.methodStack = function (method) {
  if (this.debug()) {
    this._methodStack.push(method);
  }
};

Client.prototype.query = function (query) {
  if (this.debug()) {
    this._queryPhases.push(query.cql);
  }
  this._cql = query.cql;
};

Client.prototype._wrapMethod = function (component, method, fn, _arguments) {
  if (component)
    this.component(component);
  if (method)
    this.methodStack(method);
  return fn.apply(this, _.toArray(_arguments));
};

Client.prototype._initKeyspaceBuilder = function () {
  keyspaceBuilder = require("./schema/keyspaceBuilder");
};

Client.prototype._initColumnFamilyBuilder = function () {
  columnFamilyBuilder = require("./schema/columnFamilyBuilder");
};

Client.prototype._initQueryBuilder = function () {
  queryBuilder = require("./query/queryBuilder");
};

Client.prototype._group = function () {
  this._grouped = _.groupBy(this._statements, "grouping");
};

Client.prototype._checkCompile = function () {
  if (this._isCompiling) {
    this._bindings.length = 0;
    this._group();
    this[this._compileMethod]();
  }
};

// print debug of object
Client.prototype._debugLog = function () {
  if (this.debug()) {
    console.log(this);
  }
};

module.exports = Client;
