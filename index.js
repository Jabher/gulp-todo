'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var path = require('path');

//test for comments that have todo/fixme + text
var rCommentsValidator = /(?:(?:\/\/)|\#)[-–—]*\s*(TODO|FIXME)\s*(.*)$/igm;

/**
 * calculate set of chars, which define End_OF_line
 * @param text
 */
function getEofOfTextStream(text) {
	var lines = [], rn_cnt = 0, n_cnt = 0;
	lines = text.split('\r\n');
	rn_cnt = lines.length;

	lines = text.split('\n');
	n_cnt = lines.length;

	if (rn_cnt >= n_cnt) {
		return '\r\n';
	} else {
		return '\n';
	}
}

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
				var eof = getEofOfTextStream(content);
				var fileCommentsObject = {};
				var fileLines = content.split(eof);

				var fileComments = fileLines.map(function (line, index) {
					rCommentsValidator.lastIndex = 0;
					var commentString = rCommentsValidator.exec(line);
					if (commentString) return ({
						line: index,
						type: commentString[1].toUpperCase(),
						value: commentString[2].trim()
					})
				}).filter(function (a) {
						return a;
					});
				if (fileComments.length) {
					fileComments.forEach(function (record) {

						if (record.value.length <= record.type.length + 1 && record.line+1 < fileLines.length) { // too short description
							record.value = fileLines[record.line+1].trim();
						}

						fileCommentsObject[record.line] = record.type + ': ' + record.value;
					});
					var key = file.path.replace(file.cwd + path.sep, '');
					comments[key] = fileCommentsObject;
				}
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
