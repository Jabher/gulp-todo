'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var path = require('path');

//test for comments that have todo/fixme + text
var rCommentsValidator = /(?:(?:\/\/)|\#)[-–—]*\s*(TODO|FIXME)\s*(.*)$/igm;

//split todo/fixme comments
var rCommentsSplit = /(TODO|FIXME):?/i;

Object.defineProperties(Array.prototype, {
    contains: {value: function (v) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] === v) return true;
        }
        return false;
    }},
    unique: {value: function () {
        var arr = [];
        for (var i = 0; i < this.length; i++) {
            if (!arr.contains(this[i])) {
                arr.push(this[i]);
            }
        }
        return arr;
    }}
})
/**
 * generateContents
 * generates the markdown output
 * TODO export to a lib
 *
 * @param comments
 * @param newLine
 * @return
 */
var generateContents = function (comments, newLine) {
    var contents = [];
    return Object.getOwnPropertyNames(comments).map(function (key) {
        var fileRecord = '',
            fileComments = comments[key];
        if (!fileComments) return;
        fileRecord += '## File: ' + key;
        fileRecord += newLine;
        fileRecord += ['TODO', 'FIXME'].map(function (kind) {

            var kindComments = fileComments.filter(function (comment) {
                return comment.kind === kind;
            });
            if (!kindComments.length) return null;
            return {
                kind: kind,
                comments: kindComments
            }
        })
            .filter(function (a) {
                return a;
            })
            .map(function (kind) {
                return '###' + kind.kind + 's' + newLine + kind.comments.map(function (comment) {
                    return '+ ' + comment.text + ' @line ' + comment.line
                }).join(newLine)
            }).join(newLine);
        return fileRecord;
    }).join(newLine + newLine);

}

/**
 * mapCommentObject
 *
 * @param comment
 * @return
 */
//TODO export a to a lib
var mapCommentObject = function (comment) {
    //get comment text
    var _text = comment.value.trim();
    //get comment kind
    var _kind = comment.type.trim().toUpperCase();
    //get comment line
    var _line = comment.line;

    return {
        text: _text,
        kind: _kind,
        line: _line
    };
};

/**
 * getCommentsFromAst
 * returns an array of comments generated from this file
 * TODO export this to a lib
 *
 * @param ast
 * @param file
 * @return
 */
var getCommentsFromAst = function (ast, file) {
    //fail safe return
    if (!ast || !ast.length) return [];
    var _path = file.path || 'unknown file';
    var _file = _path.replace(file.cwd + path.sep, '');

    return {
        comments: ast.map(mapCommentObject),
        file: _file
    }
};

module.exports = function (params) {
    params = params || {};
    //target filename
    var fileName = params.fileName || 'todo.md';
    //first file to capture cwd
    var firstFile;
    //newline separator
    var newLine = params.newLine || gutil.linefeed;
    var comments = {};

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
                var content = file.contents.toString('utf8');
                ast = [];
                content.split('\n').forEach(function (line, index) {
                    rCommentsValidator.lastIndex = 0;
                    var commentString = rCommentsValidator.exec(line);
                    if (commentString) ast.push({
                        type: commentString[1],
                        value: commentString[2],
                        line: index
                    })
                })

            } catch (err) {
                err.message = 'gulp-todo: ' + err.message;
                this.emit('error', new gutil.PluginError('gulp-todo', err));
            }

            //assign first file to get relative cwd/path
            if (!firstFile) firstFile = file;


            var fileComments = getCommentsFromAst(ast, file);
            comments[fileComments.file] = fileComments.comments;

            return cb();
        },
        function (cb) {
            if (!firstFile) return cb();


            //build stream file
            var mdFile = new gutil.File({
                cwd: firstFile.cwd,
                base: firstFile.cwd,
                path: path.join(firstFile.cwd, fileName),
                contents: new Buffer(generateContents(comments, newLine))
            });
            comments = {};
            //push file
            this.push(mdFile);
            return cb();
        });
};
