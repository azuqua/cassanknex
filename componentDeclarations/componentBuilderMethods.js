/**
 * Created by austin on 3/30/15.
 */

module.exports = {
  "columnFamily": {
    "primary": {"name": "primary", "grouping": "column", jsType: "PRIMARY_KEY"},

    "frozen": {"name": "frozen", "grouping": "column", jsType: "object"},
    "list": {"name": "list", "grouping": "column", jsType: "array"},
    "set": {"name": "set", "grouping": "column", jsType: "array"},
    "decimal": {"name": "decimal", "grouping": "column", jsType: "bigDecimal"},
    "boolean": {"name": "boolean", "grouping": "column", jsType: "boolean"},
    "blob": {"name": "blob", "grouping": "column", jsType: "buffer"},
    "timestamp": {"name": "timestamp", "grouping": "column", jsType: "date"},
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

    "withCaching": {"name": "caching", "grouping": "with"},
    "withCompression": {"name": "compression", "grouping": "with"},
    "withCompaction": {"name": "compaction", "grouping": "with"},
    "withClusteringOrderBy": {"name": "clustering", "grouping": "with"},

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

    "set": {"name": "set", "grouping": "set"},

    "if": {"name": "if", "grouping": "if"},
    "ifExists": {"name": "ifExists", "grouping": "if"},
    "ifNotExists": {"name": "ifNotExists", "grouping": "if"},

    "usingTTL": {"name": "usingTTL", "grouping": "using"},
    "usingTimestamp": {"name": "usingTimestamp", "grouping": "using"},

    "limit": {"name": "limit", "grouping": "limit"},

    "allowFiltering": {"name": "allowFiltering", "grouping": "allow"}
  }
};
