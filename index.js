'use strict';
var gutil = require('gulp-util'),
    through = require('through2'),
    path = require('path'),
    File = gutil.File,
    Buffer = require('buffer').Buffer,
    formatters = require('./lib/formatters'),
    commentsExtractor = require('./lib/commentsExtractor');

module.exports = function (params) {
    params = params || {};
    var formatter = formatters[params.formatter] || formatters.default,
        fileName = params.fileName || 'todo.json', //target filename
        firstFile = null, //first file to capture cwd
        comments = {};

    function parseContent(file, enc, cb) {
        if (file.isNull()) return cb();
        if (file.isStream()) return this.emit('error', new gutil.PluginError('gulp-todo', 'Streaming not supported'));
        if (!firstFile) firstFile = file;

        var fileComments = commentsExtractor(file, enc);
        if (fileComments.length) comments[file.path.replace(file.cwd + path.sep, '')] = formatter(fileComments);

        cb();
    }

    function endStream() {
        //build stream file
        var contents = new Buffer(JSON.stringify(comments, null, 4));

        var outFile = new File({
            cwd: firstFile.cwd,
            base: firstFile.cwd,
            path: path.join(firstFile.cwd, fileName),
            contents: contents
        });

        this.emit('data', outFile);
        this.emit('end');
    }

    return through.obj(parseContent, endStream);
};
