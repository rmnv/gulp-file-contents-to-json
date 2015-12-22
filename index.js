'use strict';

var through2 = require('through2');
var gutil = require('gulp-util');
var path = require('path');

var nconf = require('nconf');
nconf.file({ file: 'store.json' });

var PLUGIN_NAME = 'gulp-file-contents-to-json';

module.exports = function (options) {

  var first = null;
  var guid = 'xxxxxxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0,v=c==='x'?r:r&0x3|0x8;return v.toString(16);
  });

  return through2.obj(function (file, enc, callback) {

    // Always error if file is a stream or null.
    if ( file.isNull() ) {
      return callback();
    }
    else if ( file.isStream() ) {
      this.emit('error', new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported.'));
      return callback();
    }

    try {

      // Use nconf to create a json object of our files.
      first = first || file;
      var id = file.path.replace(file.base, '').split('/').join(':').replace(/\.[^/.]+$/, '');   // 'foo/bar/bax.txt' => 'foo:bar:baz'
      var contents = file.contents.toString("utf-8");
      nconf.set(guid + ':' + id, contents);


      // Create file which will become the JSON blob.
      var outputJSON = JSON.stringify(nconf.get(guid), null, 2);
      if (options.wrapper) {
        outputJSON = '{ "' + options.wrapper + '": '+ outputJSON +' }'
      }

      var out = new gutil.File({
        base: first.base,
        cwd: first.cwd,
        path: path.join(file.base, options.filename),
        contents: new Buffer(outputJSON)
      });

      this.push(out);
      callback();
    } catch (e) {
      this.emit('error', new gutil.PluginError(PLUGIN_NAME, 'Error:', e));
      callback(e);
    }

  });

};
