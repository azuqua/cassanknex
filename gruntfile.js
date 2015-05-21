/**
 * Created by austin on 4/5/15.
 */

"use strict";
module.exports = function (grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

    mochaTest: {
      run: {
        options: {reporter: "spec", checkLeaks: true},
        src: ["tests/*.js"]
      },
      live: {
        options: {reporter: "spec", checkLeaks: true},
        src: ["tests/live/*.js"]
      }
    },

    jshint: {
      files: ["*.js", "queryBuilder/*.js", "schema/*.js"],
      options: {
        node: true,
        laxcomma: true
      }
    }

  });

  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-mocha-test");

  grunt.registerTask("lint", ["jshint"]);

  grunt.registerTask("test", ["mochaTest:run"]);
  grunt.registerTask("test-live", ["mochaTest:live"]);

  grunt.registerTask("default", ["lint", "test"]);
};
