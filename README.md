
[![NPM Version][npm-image]][npm-url]
[![Inline docs][inch-image]][inch-url]
[![Build Status][travis-image]][travis-url]

[npm-image]: https://img.shields.io/npm/v/cassanknex.svg?style=flat
[npm-url]: https://npmjs.org/package/cassanknex
[inch-image]: http://inch-ci.org/github/azuqua/cassanknex.svg?branch=master
[inch-url]: http://inch-ci.org/github/azuqua/cassanknex
[travis-image]: https://travis-ci.org/azuqua/cassanknex.svg?branch=master&style=flat
[travis-url]: https://travis-ci.org/azuqua/cassanknex

# CassanKnex

A CLQ query builder written in the spirit of [Knex](knexjs.org) for [CQL 3.1.x](http://docs.datastax.com/en/cql/3.1/cql/cql_reference/cqlReferenceTOC.html).

## Why

CQL was purposefully designed to be SQL-esq to enhance ease of access for those familiar w/ relational databases
while Knex is the canonical NodeJS query builder for SQL dialects; however, even given the lexical similarities, the differences
between the usage of CQL vs SQL is significant enough that adding CQL as yet another Knex SQL dialect does not make sense.
Thus, CassanKnex.

## Usage

CassanKnex can be used to execute queries against a Cassandra cluster or as a simple CQL statement generator via the following relative instantiations:

- As a query executor
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

  qb.exec(function(err, res) {
    // do something w/ your query response
  });
});
```

- As a query generator
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

While fuller documentation for all methods is in the works, **the [test files](./tests) provide thorough examples as to method usage**.

### Quickstart


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

### Debugging

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

### <a name="QueryCommands"></a>Query Commands

#### *For standard queries*:
- delete
- insert
- select
- update

#### *For column family queries*:
- alterColumnFamily
- createColumnFamily
- createColumnFamilyIfNotExists
- dropColumnFamily
- dropColumnFamilyIfExists

#### *For keyspace queries*:
- alterKeyspace
- createKeyspace
- createKeyspaceIfNotExists
- dropKeyspace
- dropKeyspaceIfExists

### <a name="QueryModifiers"></a>Query Modifiers

#### *For standard queries*:
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

#### *For column family queries*:
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

#### *For keyspace queries*:
- withNetworkTopologyStrategy
- withSimpleStrategy
- withDurableWrites
