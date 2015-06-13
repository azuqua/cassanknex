
[![NPM Version][npm-image]][npm-url]
[![Inline docs][inch-image]][inch-url]
[![Build Status][travis-image]][travis-url]

# CassanKnex

An Apache Cassandra CQL query builder with support for the DataStax NodeJS driver, written in the spirit of [Knex][knexjs-url] for [CQL 3.1.x][cassandra-cql-3_1-ref-url].

## Index

- [Why Cassanknex](#WhyCassanknex)
- [Usage](#Usage)
  - [Generating Queries](#GeneratingQueries)
  - [Executing Queries](#ExecutingQueries)
  - [Quick Start](#Quickstart)
  - [Debugging Queries](#Debugging)
  - [Query Commands](#QueryCommands)
    - [Rows](#QueryCommands-Rows)
    - [Column Families](#QueryCommands-ColumnFamilies)
    - [Keyspaces](#QueryCommands-Keyspaces)
  - [Query Modifiers](#QueryModifiers)
    - [Rows](#QueryModifiers-Rows)
    - [Column Families](#QueryModifiers-ColumnFamilies)
    - [Keyspaces](#QueryModifiers-Keyspaces)
- [ChangeLog](#ChangeLog)

## <a name="WhyCassanknex"></a>Why

CQL was purposefully designed to be SQL-esq to enhance ease of access for those familiar w/ relational databases
while Knex is the canonical NodeJS query builder for SQL dialects; however, even given the lexical similarities, the difference
between the usage of CQL vs SQL is significant enough that adding CQL as yet another Knex SQL dialect does not make sense.
Thus, CassanKnex.

## <a name="Usage"></a>Usage

CassanKnex can be used to execute queries against a Cassandra cluster via [`cassandra-driver`][cassandra-driver-url] (the official DataStax NodeJS driver) or as a simple CQL statement generator via the following relative instantiations:

### <a name="GeneratingQueries"></a>As a query generator

Compiled CQL statements can be retrieved at any time via the `cql` method.

```js
var cassanKnex = require("cassanknex")();
var qb = cassanKnex.QUERY_COMMAND()
          .QUERY_MODIFIER_1()
          .
          .
          .QUERY_MODIFIER_N();

var cql = qb.cql(); // get the cql statement
```

Where `QUERY_COMMAND` and `QUERY_MODIFIER` are among the list of available [Query Commands](#QueryCommands)  and [Query Modifiers](#QueryModifiers).

### <a name="ExecutingQueries"></a>As a query executor

Execution of a given query is performed by invoking either the `exec`, `stream` or `eachRow` methods
(which are straight pass throughs to the DataStax driver's `execute`, `stream` and `eachRow` [methods][cassandra-driver-docs-url], respectively).

```js
var cassanKnex = require("cassanknex")({
  connection: {
    contactPoints: ["LIST OF CONNECTION POINTS"]
  }
});

cassanKnex.on("ready", function (err) {

  if (err)
    console.error("Error Connecting to Cassandra Cluster", err);
  else
    console.log("Cassandra Connected");

  var qb = cassanKnex.QUERY_COMMAND()
          .QUERY_MODIFIER_1()
          .
          .
          .QUERY_MODIFIER_N();

  // pass through to the underlying DataStax nodejs-driver 'execute' method

  qb.exec(function(err, res) {
    // do something w/ your query response
  });

  // OR pass through to the underlying DataStax nodejs-driver 'stream' method

  var onReadable = function () {
      // Readable is emitted as soon a row is received and parsed
      var row;
      while (row = this.read()) {
        console.log(row);
        // do something w/ the row response
      }
    }
    , onEnd = function () {
      // Stream ended, there aren't any more rows
      console.log("query finished");
    }
    , onError = function (err) {
      // Something went wrong: err is a response error from Cassandra
      console.log("query error", err);
    };

  // Invoke the stream method
  qb.stream({
    "readable": onReadable,
    "end": onEnd,
    "error": onError
  });

  // OR pass through to the underlying DataStax nodejs-driver 'eachRow' method

  var rowCallback = function (n, row) {
      // The callback will be invoked per each row as soon as they are received
      console.log(row);
      // do something w/ the row response
    }
    , errorCb = function (err) {
      // Something went wrong: err is a response error from Cassandra
      console.log("query error", err);
    };

  // Invoke the eachRow method
  qb.eachRow(rowCallback, errorCb);
});
```

While fuller documentation for all methods is in the works, **the [test files](./tests) provide thorough examples as to method usage**.

#### <a name="Quickstart"></a>Quickstart


```js
var cassanKnex = require("cassanknex")({
  connection: { // default is 'undefined'
    contactPoints: ["10.0.0.2"]
  },
  exec: { // default is '{}'
    prepare: false // default is 'true'
  }
});

cassanKnex.on("ready", function (err) {

  if (err)
    console.error("Error Connecting to Cassandra Cluster", err);
  else {
    console.log("Cassandra Connected");

  var qb.select("id", "foo", "bar", "baz")
    .where("id", "=", "1")
    .orWhere("id", "in", ["2", "3"])
    .orWhere("baz", "=", "bar")
    .andWhere("foo", "IN", ["baz", "bar"])
    .limit(10)
    .from("table")
    .exec(function(err, res) {

      // executes query :
      //  "SELECT id,foo,bar,baz FROM cassanKnexy.table
      //    WHERE id = ? OR id in (?, ?)
      //    OR baz = ? AND foo IN (?, ?)
      //    LIMIT 10;"
      // with bindings array  : [ '1', '2', '3', 'bar', 'baz', 'bar' ]

      if (err)
        console.error("error", err);
      else
        console.log("res", res);

    });
  }
});

```

#### <a name="Debugging"></a>Debugging

To enable `debug` mode pass `{ debug: true }` into the CassanKnex `require` statement, e.g.

```
var cassanKnex = require("cassanknex")({ debug: true });

```

When `debug` is enabled the query object will be logged upon execution,
and you'll receive two informational components provided to ease the act of debugging:

1. `_queryPhases`:
  - An array showing the state of the query string at each step of it's compilation.
2. `_methodStack`:
  - An array showing the methods called throughout the modification lifespan of the query object.
  You'll notice that the 'compiling' method is called after each modification in this stack, that's due to
  re-compiling the query statement (and pushing the result into `_queryPhases`) at each step, when `debug == false`
  the `_cql` query statement and accompanying `_bindings` array are not created until either `qb.cql()` or `qb.exec()`
  are called.

So you'll see something akin to the following `insert` statement upon invoking either `qb.cql()` or `qb.exec()`:
```js
var values = {
  "id": "foo"
  , "bar": "baz"
  , "baz": ["foo", "bar"]
};
var qb = cassanknex("cassanKnexy");
qb.insert(values)
      .usingTimestamp(250000)
      .usingTTL(50000)
      .into("columnFamily")
      .cql();

// =>
{ _debug: true,
  _dialect: 'cql',
  _keyspace: 'cassanKnexy',
  _columnFamily: 'columnFamily',
  _component: 'query',
  _methodStack:
   [ 'insert',
     'usingTimestamp',
     'insert',
     'usingTTL',
     'insert',
     'table',
     'insert' ],
  _queryPhases:
   [ 'INSERT INTO  (id,bar,baz) VALUES (?, ?, ?);',
     'INSERT INTO  (id,bar,baz) VALUES (?, ?, ?) USING TIMESTAMP ?;',
     'INSERT INTO  (id,bar,baz) VALUES (?, ?, ?) USING TIMESTAMP ? AND USING TTL ?;',
     'INSERT INTO cassanKnexy.columnFamily (id,bar,baz) VALUES (?, ?, ?) USING TIMESTAMP ? AND USING TTL ?;' ],
  _cql: 'INSERT INTO cassanKnexy.columnFamily (id,bar,baz) VALUES (?, ?, ?) USING TIMESTAMP ? AND USING TTL ?;',
  _bindings: [ 'foo', 'baz', [ 'foo', 'bar' ], 250000, 50000 ],
  _statements:
   [ { grouping: 'compiling', type: 'insert', value: [Object] },
     { grouping: 'using', type: 'usingTimestamp', val: 250000 },
     { grouping: 'using', type: 'usingTTL', val: 50000 } ],
  ... }
```

#### <a name="QueryCommands"></a>Query Commands

##### <a name="QueryCommands-Rows"></a>*For standard (row) queries*:
- delete
- insert
- select
- update

##### <a name="QueryCommands-ColumnFamilies"></a>*For column family queries*:
- alterColumnFamily
- createColumnFamily
- createColumnFamilyIfNotExists
- dropColumnFamily
- dropColumnFamilyIfExists
- createIndex

##### <a name="QueryCommands-Keyspaces"></a>*For keyspace queries*:
- alterKeyspace
- createKeyspace
- createKeyspaceIfNotExists
- dropKeyspace
- dropKeyspaceIfExists

#### <a name="QueryModifiers"></a>Query Modifiers

##### <a name="QueryModifiers-Rows"></a>*For standard (row) queries*:
- from
- into
- where
- andWhere
- orWhere
- set
- if
- ifExists
- ifNotExists
- usingTTL
- usingTimestamp
- limit

##### <a name="QueryModifiers-ColumnFamilies"></a>*For column family queries*:
- alter
- drop
- rename
- primary
- list
- set
- decimal
- boolean
- blob
- timestamp
- inet
- bigint
- counter
- double
- int
- float
- map
- ascii
- text
- timeuuid
- uuid
- varchar
- withCaching
- withCompression
- withCompaction
- withClusteringOrderBy

##### <a name="QueryModifiers-Keyspaces"></a>*For keyspace queries*:
- withNetworkTopologyStrategy
- withSimpleStrategy
- withDurableWrites

#### <a name="ChangeLog"></a>ChangeLog

- 1.3.0
  - Add support for the DataStax driver `eachRow` method.
- 1.2.0
  - Add support for the DataStax driver `stream` method.
- 1.1.0
  - Add QueryCommand `createIndex`.
  - Add QueryModifier `allowFiltering`.

[npm-image]: https://img.shields.io/npm/v/cassanknex.svg?style=flat
[npm-url]: https://npmjs.org/package/cassanknex
[inch-image]: http://inch-ci.org/github/azuqua/cassanknex.svg?branch=master&style=shields
[inch-url]: http://inch-ci.org/github/azuqua/cassanknex
[travis-image]: https://travis-ci.org/azuqua/cassanknex.svg?branch=master&style=flat
[travis-url]: https://travis-ci.org/azuqua/cassanknex

[cassandra-cql-3_1-ref-url]: http://docs.datastax.com/en/cql/3.1/cql/cql_reference/cqlReferenceTOC.html
[cassandra-driver-url]: https://github.com/datastax/nodejs-driver
[cassandra-driver-docs-url]: http://docs.datastax.com/en/drivers/nodejs/2.1/Client.html
[knexjs-url]: http://knexjs.org/
