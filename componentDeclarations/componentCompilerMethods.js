/**
 * Created by austin on 3/29/15.
 */

module.exports = {
  "keyspace": {
    "alterKeyspace": "alterKeyspace",
    "createKeyspace": "createKeyspace",
    "createKeyspaceIfNotExists": "createKeyspaceIfNotExists",
    "dropKeyspace": "dropKeyspace",
    "dropKeyspaceIfExists": "dropKeyspaceIfExists"
  },
  "columnFamily": {
    "alterColumnFamily": "alterColumnFamily",
    "createColumnFamily": "createColumnFamily",
    "createColumnFamilyIfNotExists": "createColumnFamilyIfNotExists",
    "dropColumnFamily": "dropColumnFamily",
    "dropColumnFamilyIfExists": "dropColumnFamilyIfExists",

    "createIndex": "createIndex",

    "alterType": "alterType",
    "createType": "createType",
    "createTypeIfNotExists": "createTypeIfNotExists",
    "dropType": "dropType",
    "dropTypeIfExists": "dropTypeIfExists"

  },
  "query": {
    "delete": "delete",
    "insert": "insert",
    "select": "select",
    "update": "update"
  }
};
