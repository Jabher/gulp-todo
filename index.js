'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var path = require('path');

//test for comments that have todo/fixme + text
var rCommentsValidator = /(?:(?:\/\/)|\#)[-–—]*\s*(TODO|FIXME)\s*(.*)$/igm;

//split todo/fixme comments
var rCommentsSplit = /(TODO|FIXME):?/i;
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
    var output = {
        TODO: '',
        FIXME: ''
    };

    comments.forEach(function (comment) {
        output[comment.kind] += '| ' + comment.file + ' | ' + comment.line + ' | ' + comment.text + newLine;
    });

    var contents;

    contents = '### TODOs' + newLine;
    contents += '| Filename | line # | todo' + newLine;
    contents += '|:--------:|:------:|:------:' + newLine;
    contents += output.TODO + newLine + newLine;

    contents += '### FIXMEs' + newLine;
    contents += '| Filename | line # | fixme' + newLine;
    contents += '|:--------:|:------:|:------:' + newLine;
    contents += output.FIXME;

    return contents;
};

/**
 * mapCommentObject
 *
 * @param comment
 * @return
 */
//TODO export a to a lib
var mapCommentObject = function (comment) {
    //get relative file name
    var _path = this.path || 'unknown file';
    var _file = _path.replace(this.cwd + path.sep, '');
    //get comment text
    var _text = comment.value.trim();
    //get comment kind
    var _kind = comment.type.trim().toUpperCase();
    //get comment line
    var _line = comment.line;

    return {
        file: _file,
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
    if (!ast || !ast.comments || !ast.comments.length) return [];

    return ast.comments.map(mapCommentObject, file);
};

module.exports = function (params) {
    params = params || {};
    //target filename
    var fileName = params.fileName || 'todo.md';
    //first file to capture cwd
    var firstFile;
    //newline separator
    var newLine = params.newLine || gutil.linefeed;
    var comments = [];

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
                ast = {};
                ast.comments = [];
                content.split('\n').forEach(function(line, index){
                    rCommentsValidator.lastIndex = 0;    
                    var commentString = rCommentsValidator.exec(content);
                    if (commentString) ast.comments.push({
                        type: commentString[1],
                        text: commentString[2],
                        line: index
                    })
                })
                
            } catch (err) {
                err.message = 'gulp-todo: ' + err.message;
                this.emit('error', new gutil.PluginError('gulp-todo', err));
            }

            //assign first file to get relative cwd/path
            if (!firstFile) {
                firstFile = file;
            }

            //todo better rename
            comments = comments.concat(getCommentsFromAst(ast, file));

            return cb();
        },
        function (cb) {
            if (!firstFile || !comments.length) {
                return cb();
            }

            //get generated output
            var contents = generateContents(comments, newLine);
            //build stream file
            var mdFile = new gutil.File({
                cwd: firstFile.cwd,
                base: firstFile.cwd,
                path: path.join(firstFile.cwd, fileName),
                contents: new Buffer(contents)
            });

            //push file
            this.push(mdFile);
            return cb();
        });
};
