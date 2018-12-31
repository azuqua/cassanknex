/**
 * Created by austin on 3/30/15.
 */

module.exports = {
  "columnFamily": {
    "primary": {"name": "primary", "grouping": "column", jsType: "PRIMARY_KEY"},

    "frozen": {"name": "frozen", "grouping": "column", jsType: "object"},
    "frozenSet": {"name": "frozenSet", "grouping": "column", jsType: "object"},
    "frozenMap": {"name": "frozenMap", "grouping": "column", jsType: "object"},
    "frozenList": {"name": "frozenList", "grouping": "column", jsType: "object"},
    "list": {"name": "list", "grouping": "column", jsType: "array"},
    "set": {"name": "set", "grouping": "column", jsType: "array"},
    "decimal": {"name": "decimal", "grouping": "column", jsType: "bigDecimal"},
    "boolean": {"name": "boolean", "grouping": "column", jsType: "boolean"},
    "blob": {"name": "blob", "grouping": "column", jsType: "buffer"},
    "timestamp": {"name": "timestamp", "grouping": "column", jsType: "date"},
    "date": {"name": "date", "grouping": "column", jsType: "date"},
    "inet": {"name": "inet", "grouping": "column", jsType: "inetAddress"},
    "bigint": {"name": "bigint", "grouping": "column", jsType: "long"},
    "counter": {"name": "counter", "grouping": "column", jsType: "long"},
    "double": {"name": "double", "grouping": "column", jsType: "number"},
    "int": {"name": "int", "grouping": "column", jsType: "number"},
    "float": {"name": "float", "grouping": "column", jsType: "number"},
    "map": {"name": "map", "grouping": "column", jsType: "object"},
    "ascii": {"name": "ascii", "grouping": "column", jsType: "string"},
    "text": {"name": "text", "grouping": "column", jsType: "string"},
    "timeuuid": {"name": "timeuuid", "grouping": "column", jsType: "string"},
    "uuid": {"name": "uuid", "grouping": "column", jsType: "string"},
    "varchar": {"name": "varchar", "grouping": "column", jsType: "string"},

    "with": {"name": "with", "grouping": "with"},
    "withCaching": {"name": "caching", "grouping": "with"},
    "withCompression": {"name": "compression", "grouping": "with"},
    "withCompaction": {"name": "compaction", "grouping": "with"},
    "withClusteringOrderBy": {"name": "clustering", "grouping": "with"},
    "withOptions": {"name": "options", "grouping": "with"},

    "alter": {"name": "alter", "grouping": "alter"},
    "drop": {"name": "drop", "grouping": "alter"},
    "rename": {"name": "rename", "grouping": "alter"}
  },
  "keyspace": {
    "withNetworkTopologyStrategy": {"name": "NetworkTopologyStrategy", "grouping": "strategy"},
    "withSimpleStrategy": {"name": "SimpleStrategy", "grouping": "strategy"},
    "withDurableWrites": {"name": "DURABLE_WRITES", "grouping": "and"}//,
    //"raw": {"name": "raw", "grouping": "raw"}
  },
  "query": {
    "from": {"name": "from", "grouping": "source"},
    "into": {"name": "into", "grouping": "source"},

    "where": {"name": "where", "grouping": "where"},
    //"whereRaw": {"name": "whereRaw", "grouping": "where"},
    "andWhere": {"name": "andWhere", "grouping": "where"},
    "orWhere": {"name": "orWhere", "grouping": "where"},
    "tokenWhere": {"name": "tokenWhere", "grouping": "where"},
    "minTimeuuidWhere": {"name": "minTimeuuidWhere", "grouping": "where"},
    "maxTimeuuidWhere": {"name": "maxTimeuuidWhere", "grouping": "where"},

    "orderBy": {"name": "orderBy", "grouping": "orderBy"},

    "set": {"name": "set", "grouping": "set"},
    "add": {"name": "add", "grouping": "set"},
    "remove": {"name": "remove", "grouping": "set"},
    "increment": {"name": "increment", "grouping": "set"},
    "decrement": {"name": "decrement", "grouping": "set"},

    "if": {"name": "if", "grouping": "if"},
    "ifExists": {"name": "ifExists", "grouping": "ifExists"},
    "ifNotExists": {"name": "ifNotExists", "grouping": "ifNotExists"},

    "usingTTL": {"name": "usingTTL", "grouping": "using"},
    "usingTimestamp": {"name": "usingTimestamp", "grouping": "using"},

    "limit": {"name": "limit", "grouping": "limit"},
    "limitPerPartition": {"name": "limitPerPartition", "grouping": "limit"},

    "count": {"name": "count", "grouping": "aggregate"},
    "ttl": {"name": "ttl", "grouping": "aggregate"},
    "writetime": {"name": "writetime", "grouping": "aggregate"},
    "dateOf": {"name": "dateOf", "grouping": "aggregate"},
    "unixTimestampOf": {"name": "unixTimestampOf", "grouping": "aggregate"},
    "toDate": {"name": "toDate", "grouping": "aggregate"},
    "toTimestamp": {"name": "toTimestamp", "grouping": "aggregate"},
    "toUnixTimestamp": {"name": "toUnixTimestamp", "grouping": "aggregate"},

    "allowFiltering": {"name": "allowFiltering", "grouping": "allow"}
  }
};
