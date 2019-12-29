
# Onward, Minio... Contributors!

![Minions](http://i.giflike.com/zzljJpp.gif)

## Pull Requests

For most PR's (read: additive feature requests), please submit against the `develop` branch;
this is to ensure that we may quickly merge the changes in and allow the community to critique/modify
the proposed changes from a common source.

## Code Format

Follow the same coding format seen in the source code; the one hard requirement is that code indentation
**must** be two hard spaces (no soft tabs), this is to ensure that diff views of code submission remains legible.

## Tests

There is an exhaustive test suite under `/tests`; statement compilation tests may be run using `yarn run test` (executing `tests/*.js` files),
and tests against a live Cassandra cluster may be run via `yarn run test:live` (executing `tests/live/live.test.js`).

PR's that provide additional functionality should also provide corresponding unit test cases.
