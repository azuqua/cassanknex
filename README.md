
[![NPM Version][npm-image]][npm-url]
[![Inline docs][inch-image]][inch-url]
[![Build Status][travis-image]][travis-url]

# CassanKnex

A [fully tested][travis-url] Apache Cassandra CQL query builder with support for the [DataStax NodeJS driver][cassandra-driver-url], written in the spirit of [Knex][knexjs-url] for [CQL 3.x][cassandra-cql-3_1-ref-url].

## Installation

```
npm install cassanknex
```

## Index

- [Why CassanKnex](#WhyCassanknex)
- [Usage](#Usage)
  - [Generating Queries](#GeneratingQueries)
  - [Executing Queries](#ExecutingQueries)
  - [Bring Your Own Driver](#BYOD)
  - [Quick Start](#Quickstart)
  - [Debugging Queries](#Debugging)
  - [Query Executors (Examples)](#QueryExecutors)
    - [`exec`](#exec)
    - [`eachRow`](#eachrow)
    - [`stream`](#stream)
    - [`batch`](#batch)
  - [Query Commands (Examples)](#QueryCommands)
    - [Rows](#QueryCommands-Rows)
    - [Column Families](#QueryCommands-ColumnFamilies)
    - [Keyspaces](#QueryCommands-Keyspaces)
  - [Query Modifiers](#QueryModifiers)
    - [Rows](#QueryModifiers-Rows)
    - [Column Families](#QueryModifiers-ColumnFamilies)
    - [Keyspaces](#QueryModifiers-Keyspaces)
  - [Utility Methods](#UtilityMethods)
- [ChangeLog](#ChangeLog)

## <a name="WhyCassanknex"></a>Why (what's in a name)

CQL was purposefully designed to be SQL-esq to enhance ease of access for those familiar w/ relational databases
while Knex is the canonical NodeJS query builder for SQL dialects; however, even given the lexical similarities, the difference
between the usage of CQL vs SQL is significant enough that adding CQL as yet another Knex SQL dialect does not make sense.
Thus, CassanKnex.

## <a name="Usage"></a>Usage

CassanKnex can be used to execute queries against a Cassandra cluster via [`cassandra-driver`][cassandra-driver-url] (the official DataStax NodeJS driver) or as a simple CQL statement generator via the following relative instantiations:

### <a name="GeneratingQueries"></a>As a query generator

Compiled CQL statements can be retrieved at any time via the `cql` method.

```js
var cassanKnex = require("cassanknex")(<DRIVER_OPTIONS|undefined>);
var qb = cassanKnex(KEYSPACE).QUERY_COMMAND()
          .QUERY_MODIFIER_1()
          .
          .
          .QUERY_MODIFIER_N();

var cql = qb.cql(); // get the cql statement
```

Where `KEYSPACE` is the name of the relevant keyspace and
`QUERY_COMMAND` and `QUERY_MODIFIER` are among the list of available [Query Commands](#QueryCommands)  and [Query Modifiers](#QueryModifiers).

`<DRIVER_OPTIONS>` may be provided to configure the client, and is an object w/ the following optional fields:

- `connection`: `<InitializedDatastaxDriverInstance>` or `<DatastaxConnectionArguments>`
  The client will use an initialized datastax driver instance if provied (either the [Cassandra driver][cassandra-driver-url] or [DSE driver][dse-driver-url] will work).
  Alternatively, you can provide arguments that will be forwarded to the underlying Cassandra driver instance.
- `debug`: `boolean`
  Toggle debug logs (see [debugging](#Debugging)).

### <a name="ExecutingQueries"></a>As a query executor

Execution of a given query is performed by invoking either the `exec`, `stream` or `eachRow` methods
(which are straight pass throughs to the DataStax driver's `execute`, `stream` and `eachRow` [methods][cassandra-driver-docs-url], respectively);
batch queries may be executed via the `batch` method (again, a pass through to the DataStax driver's own `batch` method).

You may provide your own driver or use the included DataStax driver.

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

  var qb = cassanKnex(KEYSPACE).QUERY_COMMAND()
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

  // Invoke the batch method to process multiple requests
  cassanKnex().batch([qb, qb], function(err, res) {
    // do something w/ your response
  });
});
```

#### <a name="BYOD"></a>Bring your own Driver

While the package includes the vanilla [Cassandra driver][cassandra-driver-url] (supported by Datastax),
and will use that driver to connect to your cluster if you provide a connection configuration, you may optionally provide your own initialized driver to the `cassaknex` constructor.
This allows for using either the [DSE driver][dse-driver-url] or a different version of the Cassandra driver, per your applications needs.

e.g., w/ the built in `cassandra-driver`:

```js
var cassanKnex = require("cassanknex")({
  connection: { // default is 'undefined'
    contactPoints: ["10.0.0.2"]
  },
  exec: { // default is '{}'
    prepare: false // default is 'true'
  }
});

cassanKnex.on("ready", function (err) {...});
```

or, using a custom `dse-driver` connection:

```js
// create a new dse-driver connection
var dse = require("dse-driver");
var dseClient = new dse.Client({
  contactPoints: ["10.0.0.2"],
  queryOptions: {
    prepare: true
  },
  socketOptions: {
    readTimeout: 0
  },
  profiles: []
});

// initialize dse-driver connection
dseClient.connect(function (err) {
  if (err) {
    console.log("Error initializing dse-driver", err);
  }
  else {
    // provide connection to cassanknex constructor
    var cassanKnex = require("cassanknex")({
      connection: dseClient,
      debug: false
    });

    cassanKnex.on("ready", function (err) {
      // ...
    });
  }
});
```

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

  var qb("keyspace").select("id", "foo", "bar", "baz")
    .ttl("foo")
    .where("id", "=", "1")
    .orWhere("id", "in", ["2", "3"])
    .orWhere("baz", "=", "bar")
    .andWhere("foo", "IN", ["baz", "bar"])
    .limit(10)
    .from("table")
    .exec(function(err, res) {

      // executes query :
      //  'SELECT "id","foo","bar","baz",ttl("foo") FROM "keyspace"."table"
      //    WHERE "id" = ? OR "id" in (?, ?)
      //    OR "baz" = ? AND "foo" IN (?, ?)
      //    LIMIT 10;'
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
  _exec: {},
  _execPrepare: true,
  _keyspace: 'cassanKnexy',
  _columnFamily: 'columnFamily',
  _methodStack:
   [ 'insert',
     'usingTimestamp',
     'insert',
     'usingTTL',
     'insert',
     'into',
     'insert',
     'insert' ],
  _queryPhases:
   [ 'INSERT INTO  ("id","bar","baz") VALUES (?, ?, ?);',
     'INSERT INTO  ("id","bar","baz") VALUES (?, ?, ?) USING TIMESTAMP ?;',
     'INSERT INTO  ("id","bar","baz") VALUES (?, ?, ?) USING TIMESTAMP ? AND USING TTL ?;',
     'INSERT INTO "cassanKnexy"."columnFamily" ("id","bar","baz") VALUES (?, ?, ?) USING TIMESTAMP ? AND USING TTL ?;',
     'INSERT INTO "cassanKnexy"."columnFamily" ("id","bar","baz") VALUES (?, ?, ?) USING TIMESTAMP ? AND USING TTL ?;' ],
  _cql: 'INSERT INTO "cassanKnexy"."columnFamily" ("id","bar","baz") VALUES (?, ?, ?) USING TIMESTAMP ? AND USING TTL ?;',
  _bindings: [ 'foo', 'baz', [ 'foo', 'bar' ], 250000, 50000 ],
  _statements:
   [ { grouping: 'compiling', type: 'insert', value: [Object] },
     { grouping: 'using', type: 'usingTimestamp', val: 250000 },
     { grouping: 'using', type: 'usingTTL', val: 50000 } ],
  ... }
```

> While fuller documentation for all methods is in the works, **the [test files](./tests) provide thorough examples as to method usage**.

#### <a name="QueryExecutors"></a>Query Executors

> All methods take an optional `options` object as the first argument in the call signature; if provided, the options will be passed through to the corresponding `cassandra-driver` call.

##### exec

  - *execute a query and return the response via a callback*:

  ```js
  var item = {
    foo: "bar",
    bar: ["foo", "baz"]
  };
  var qb = cassanKnex("cassanKnexy")
    .insert(item)
    .into("columnFamily")
    .exec(function(err, result) {
      // do something w/ your err/result
    });

    // w/ options
    qb.exec({ prepare: false }, function(err, result) {
       // do something w/ your err/result
     });
  ```

##### eachRow

  - *execute a query and invoke a callback as each row is received*:

  ```js
  var rowCallback = function (n, row) {
      // Readable is emitted as soon a row is received and parsed
    }
    , errorCallback = function (err) {
      // Something went wrong: err is a response error from Cassandra
    };

  var qb = cassanKnex("cassanKnexy")
    .select()
    .from("columnFamily");

  // Invoke the eachRow method
  qb.eachRow(rowCallback, errorCallback);
  ```

##### stream

  - *execute a query and stream each row as it is received*:

  ```js
  var onReadable = function () {
      // Readable is emitted as soon a row is received and parsed
      var row;
      while (row = this.read()) {
        // do something w/ your row
      }
    }
    , onEnd = function () {
      // Stream ended, there aren't any more rows
    }
    , onError = function (err) {
      // Something went wrong: err is a response error from Cassandra
    };

  var qb = cassanKnex("cassanKnexy")
    .select()
    .from("columnFamily");

  // Invoke the stream method
  qb.stream({
    "readable": onReadable,
    "end": onEnd,
    "error": onError
  });
  ```

##### batch

  - *execute a batch of cassanknex queries in a single batch statement*:

  ```js
  var qb1 = cassanKnex("cassanKnexy")
    .insert({foo: "is bar"})
    .usingTimestamp(250000)
    .usingTTL(50000)
    .into("columnFamily");

  var qb2 = cassanKnex("cassanKnexy")
    .insert({bar: "is foo"})
    .usingTimestamp(250000)
    .usingTTL(50000)
    .into("columnFamily");

  // w/o options
  cassanKnex().batch([qb1, qb2], function(err, res) {
      // do something w/ your err/result
  });

  // w/ options
  cassanKnex().batch({prepare: true}, [qb1, qb2], function(err, res) {
      // do something w/ your err/result
  });
  ```

#### <a name="QueryCommands"></a>Query Commands

##### <a name="QueryCommands-Rows"></a>*For standard (row) queries*:
- insert - *compile an __insert__ query string*

  ```js
      var qb = cassanKnex("cassanKnexy")
        , values = {
          "id": "foo"
          , "bar": "baz"
          , "baz": ["foo", "bar"]
        };
      qb.insert(values)
        .usingTimestamp(250000)
        .usingTTL(50000)
        .into("columnFamily");

      // => INSERT INTO cassanKnexy.columnFamily (id,bar,baz)
      //      VALUES (?, ?, ?)
      //      USING TIMESTAMP ?
      //      AND USING TTL ?;
  ```
- select - *compile a __select OR select as__ query string*
  - select all columns for a given query:

    ```js
    var qb = cassanKnex("cassanKnexy");
    qb.select("id", "foo", "bar", "baz")
      .ttl("foo")
      .where("id", "=", "1")
      .orWhere("id", "in", ["2", "3"])
      .orWhere("baz", "=", "bar")
      .andWhere("foo", "IN", ["baz", "bar"])
      .limitPerPartition(10)
      .from("columnFamily");

    // => SELECT "id","foo","bar","baz",ttl("foo") FROM "cassanKnexy"."columnFamily"
    //      WHERE "id" = ?
    //      OR "id" in (?, ?)
    //      OR "baz" = ?
    //      AND "foo" IN (?, ?)
    //      PER PARTITION LIMIT ?;
    ```
  - 'select as' specified columns:

    ```js
    var qb = cassanKnex("cassanKnexy");
    qb.select({id: "foo"})
      .ttl({id: "fooTTL"})
      .limit(10)
      .from("columnFamily");

    // => SELECT "id" AS "foo",ttl("id") AS "fooTTL" FROM "cassanKnexy"."columnFamily" LIMIT ?;
    ```
- update - *compile an __update__ query string*
  - simple set column values:

  ```js
    var qb = cassanKnex("cassanKnexy");
    qb.update("columnFamily")
      .set("bar", "foo")
      .set("foo", "bar")
      .where("foo[bar]", "=", "baz")
      .where("id", "in", ["1", "1", "2", "3", "5"]);

    // => UPDATE cassanKnexy.columnFamily
    //      SET bar = ?,foo = ?
    //      WHERE foo[bar] = ?
    //      AND id in (?, ?, ?, ?, ?);
  ```

  set column values using object parameters:

  ```js
  var qb = cassanKnex("cassanKnexy");
  qb.update("columnFamily")
    .set({
      "bar": "baz",
      "foo": ["bar", "baz"]
    })
    .where("foo[bar]", "=", "baz")
    .where("id", "in", ["1", "1", "2", "3", "5"]);

  // => UPDATE cassanKnexy.columnFamily
  //      SET bar = ?,foo = ?
  //      WHERE foo[bar] = ?
  //      AND id in (?, ?, ?, ?, ?);
  ```

  - add or remove from map or list:

  ```js
  var qb = cassanKnex("cassanKnexy");
  qb.update("columnFamily")
    .add("bar", {"foo": "baz"}) // "bar" is a map
    .remove("foo", ["bar"]) // "foo" is a set
    .where("id", "=", 1);

  // => UPDATE cassanKnexy.columnFamily
  //      SET "bar" = "bar" + ?,
  //          "foo" = "foo" - ?;
  //      WHERE id = ?;
  ```

  or w/ object notation:

  ```js
  var qb = cassanKnex("cassanKnexy");
  qb.update("columnFamily")
    .add({
      "bar": {"baz": "foo"}, // "bar" is a map
      "foo": ["baz"] // "foo" is a set
    })
    .remove({
      "bar": ["foo"], // "bar" is a map
      "foo": ["bar"] // "foo" is a set
    })
    .where("id", "=", 1);
  ```

  - increment or decrement counter columns:

  ```js
  var qb = cassanKnex("cassanKnexy");
  qb.update("columnFamily")
    .increment("bar", 5) // incr by 5
    .increment("baz", 7) // incr by 7
    .decrement("foo", 9) // decr by 9
    .decrement("bop", 11) // decr by 11
    .where("id", "=", 1);

  // => UPDATE cassanKnexy.columnFamily
  //      SET "bar" = "bar" + ?,
  //          "baz" = "baz" + ?,
  //          "foo" = "foo" - ?;
  //      WHERE id = ?;
  ```

  or w/ object notation:

  ```js
  var qb = cassanKnex("cassanKnexy");
  qb.update("columnFamily")
    .increment({"bar": 5, "baz": 7})
    .decrement({"foo": 9, "bop": 11})
    .where("id", "=", 1);
  ```

- delete - *compile a __delete__ query string*
  - delete all columns for a given row:

    ```js
      var qb = cassanknex("cassanKnexy");
      qb.delete()
        .from("columnFamily")
        .where("foo[bar]", "=", "baz")
        .where("id", "in", ["1", "1", "2", "3", "5"]);

      // => DELETE  FROM cassanKnexy.columnFamily
      //      WHERE foo[bar] = ?
      //      AND id in (?, ?, ?, ?, ?);
    ```
  - delete specified columns for a given row:

    ```js
      var qb = cassanknex("cassanKnexy");
      qb.delete(["foo", "bar"])
      // OR
      qb.delete("foo", "bar")

        .from("columnFamily")
        .where("foo[bar]", "=", "baz")
        .where("id", "in", ["1", "1", "2", "3", "5"]);

      // => DELETE foo,bar FROM cassanKnexy.columnFamily
      //      WHERE foo[bar] = ?
      //      AND id in (?, ?, ?, ?, ?);
    ```

##### <a name="QueryCommands-ColumnFamilies"></a>*For column family queries*:
- alterColumnFamily
- createColumnFamily
- createColumnFamilyIfNotExists
- createIndex
- createIndexCustom
- createType
- createTypeIfNotExists
- dropColumnFamily
- dropColumnFamilyIfExists
- dropType
- dropTypeIfExists
- truncate

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
- tokenWhere
- minTimeuuidWhere
- maxTimeuuidWhere
- set
- add
- remove
- increment
- decrement
- if
- ifExists
- ifNotExists
- usingTTL
- usingTimestamp
- limit
- limitPerPartition
- orderBy
- ttl
- count
- writetime
- dateOf
- unixTimestampOf
- toDate
- toTimestamp
- toUnixTimestamp

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
- frozen
- frozenSet
- frozenMap
- with
- withCaching
- withCompression
- withCompaction
- withClusteringOrderBy
- withOptions

##### <a name="QueryModifiers-Keyspaces"></a>*For keyspace queries*:
- withNetworkTopologyStrategy
- withSimpleStrategy
- withDurableWrites

#### <a name="UtilityMethods"></a>Utility Methods

- getClient, returns the Datastax Cassandra Driver in use.

```js
var cassanKnex = require("cassanknex")({
  connection: {
    contactPoints: ["10.0.0.2"]
  }
});

cassanKnex.on("ready", function (err) {

  if (err)
    console.error("Error Connecting to Cassandra Cluster", err);
  else {
    console.log("Cassandra Connected");

    // get the Cassandra Driver
    var client = cassanKnex.getClient();
  }
});
```

- getDriver, returns the raw Datastax Cassandra Driver dependency module.

```js
var cassanKnex = require("cassanknex")();

// get the Cassandra Driver
var driver = cassanKnex.getDriver();
```

#### <a name="ChangeLog"></a>ChangeLog

- 1.20.0
  - Add QueryModifier `with` for column family statements.
- 1.19.0 (@dekelev is killing it w/ new features :thumbsup:)
  - Add where clause QueryModifiers `minTimeuuidWhere` and `maxTimeuuidWhere`, and aggregation QueryModifiers `dateOf`, `unixTimestampOf`, `toDate`, `toTimestamp`, `toUnixTimestamp` per [#48](https://github.com/azuqua/cassanknex/pull/48).
- 1.18.0 (Special thanks to @dekelev for these contributions)
  - Update project library dependencies per [#42](https://github.com/azuqua/cassanknex/pull/42).
  - Fix issue when using both the `usingTimestamp` & `usingTTL` query modifiers per [#43](https://github.com/azuqua/cassanknex/pull/43).
  - Add `writetime` query modifier per [#44](https://github.com/azuqua/cassanknex/pull/44/files).
  - Add `tokenWhere` query modifier per [#45](https://github.com/azuqua/cassanknex/pull/45/files).
- 1.17.0
  - Add `Date` type for column family compilation.
- 1.16.0
  - Add QueryModifier `count`, per issue [#30](https://github.com/azuqua/cassanknex/issues/30).
  - Update DataStax Driver module from `3.1.6` to `3.2.2`.
- 1.15.0
  - Add bring-your-own-driver support.
  - Allow supplying clustered columns via array input in the `createColumnFamily` `primary` annotation, per issue [#35](https://github.com/azuqua/cassanknex/issues/35).
- 1.14.0
  - Add QueryModifiers `withOptions`, `limitPerPartition`, `ttl`, `add` and `remove`, `increment` and `decrement`.
  - Add QueryCommand `createIndexCustom`.
  - Update DataStax Driver module from `3.1.5` to `3.1.6`.
- 1.13.1
  - Update DataStax Driver module from `3.1.1` to `3.1.5`.
- 1.13.0
  - Add `if` (for `update`), `ifExists` (for `update`), and `ifNotExists` (for `insert`) per PR [#28](https://github.com/azuqua/cassanknex/pull/28).
- 1.12.1
  - Update DataStax Driver module from `2.2.2` to `3.1.1`.
- 1.12.0
  - Add `getDriver` method to allow retrieving the raw DataStax Driver module from cassanknex per issue [#25](https://github.com/azuqua/cassanknex/issues/25).
  - Update DataStax Driver module from `2.2.1` to `2.2.2`.
- 1.11.0
  - Add `getClient` method to allow retrieving the Cassandra Driver instance from cassanknex.
- 1.10.1
  - Patch invalid error response when executing commands via an uninitialized Cassandra client.
- 1.10.0
  - Add QueryModifier `orderBy` for standard queries.
- 1.9.0
  - Add `truncate` functionality.
- 1.8.0
  - Add `batch` execution functionality per the specifications laid out in issue [#19](https://github.com/azuqua/cassanknex/issues/19).
- 1.7.1
  - Wrap all keyspace, column family, and column names in double quotes to preserve case per issue [#14](https://github.com/azuqua/cassanknex/issues/14).
  - Fix `frozen set` statement compilation per issue [#16](https://github.com/azuqua/cassanknex/issues/16).
  - Fix `frozen list` statement compilation per issue [#17](https://github.com/azuqua/cassanknex/issues/17).
- 1.7.0
  - Add QueryCommands `createType`/`IfNotExists` and `dropType`/`IfExists`.
  - Add QueryModifiers `frozen`/`Set`/`Map`/`List`.
  - 1.7.0 features added per issue [#10](https://github.com/azuqua/cassanknex/issues/10).
- 1.6.0
  - Add `options` support for `eachRow` per issue [#8](https://github.com/azuqua/cassanknex/issues/8).
- 1.5.1, 1.5.2
  - OMG DOCS!
- 1.5.0
  - Add QueryCommand `delete`.
- 1.4.0
  - Add support for object style `set` calls; e.g. `.set(<Object := {<String>: <Mixed>, ...}>)`.
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
[dse-driver-url]: https://github.com/datastax/nodejs-driver-dse
[cassandra-driver-docs-url]: http://docs.datastax.com/en/drivers/nodejs/2.1/Client.html
[knexjs-url]: http://knexjs.org/
