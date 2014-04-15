'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var path = require('path');

//test for comments that have todo/fixme + text
var rCommentsValidator = /(?:(?:\/\/)|\#)[-–—]*\s*(TODO|FIXME)\s*(.*)$/igm;

module.exports = function (params) {
    params = params || {};
    //target filename
    var fileName = params.fileName || 'todo.json';
    //first file to capture cwd
    var firstFile,
        comments = {};

    /* main object iteration */
    return through.obj(function (file, enc, cb) {
            if (file.isNull()) {
                //if file is null
                this.push(file);
                return cb();
            }

            if (file.isStream()) {
                this.emit('error', new gutil.PluginError('gulp-todo', 'Streaming not supported'));
                return cb();
            }

            var ast;

            try {
                var content = file.contents.toString(enc);
                var fileCommentsObject = {};
                var fileComments = content.split('\n').map(function (line, index) {
                    rCommentsValidator.lastIndex = 0;
                    var commentString = rCommentsValidator.exec(line);
                    if (commentString) return ({
                        line: index,
                        type: commentString[1].toUpperCase(),
                        value: commentString[2].trim()
                    })
                }).filter(function(a){return a}).forEach(function(record){
                    fileCommentsObject[record.line] = record.type + ': ' + record.value;
                });

                var key = file.path.replace(file.cwd + path.sep, '');
                if (fileComments.length) comments[key] = fileCommentsObject;
            } catch (err) {
                err.message = 'gulp-todo: ' + err.message;
                this.emit('error', new gutil.PluginError('gulp-todo', err));
            }

            //assign first file to get relative cwd/path
            if (!firstFile) firstFile = file;



            return cb();
        },
        function (cb) {
            if (!firstFile) return cb();

            //build stream file
            var mdFile = new gutil.File({
                cwd: firstFile.cwd,
                base: firstFile.cwd,
                path: path.join(firstFile.cwd, fileName),
                contents: new Buffer(JSON.stringify(comments, null, 4))
            });

            comments = {};
            //push file
            this.push(mdFile);
            return cb();
        });
};
