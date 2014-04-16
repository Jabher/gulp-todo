# [gulp](https://github.com/wearefractal/gulp)-every-todo
> Generate a TODO.md file from **ALL** your project todos and fixmes

[![NPM Version](http://img.shields.io/npm/v/gulp-todos.svg)](https://npmjs.org/package/gulp-todos)
[![NPM Downloads](http://img.shields.io/npm/dm/gulp-todos.svg)](https://npmjs.org/package/gulp-todos)
[![Dependencies](http://img.shields.io/gemnasium/Jabher/gulp-todos.svg)](https://gemnasium.com/Jabher/gulp-todos)
[![Build Status](http://img.shields.io/travis/Jabher/gulp-todos.svg)](https://travis-ci.org/Jabher/gulp-todos)

Parse all your files, and generate a todo.md

## Install

Install with [npm](https://npmjs.org/package/gulp-todos)

```
npm install --save-dev gulp-todos
```

## Example

```js
var gulp = require('gulp');
var todo = require('gulp-todos');

gulp.task('default', function() {
    gulp.src('js/**/*.js')
        .pipe(todo())
        .pipe(gulp.dest('./'));
});
```

## Options

Options can be passed along as an object containing the following fields:

#### formatter

`{String}` - specify the formatter type. defaults to `human`.
Available options:
+ `human` ()
+ `robot`

### Example human output:

```js
{
    "test/file0.js": {
        "line 0": "TODO: test"
    },
    "test/file1.js": {
        "line 0": "TODO: test"
    }
}
```
### Example robot output:

```js
{
    "test/file0.js": [
        {
            "line": 0,
            "type": "TODO",
            "value": "test"
        }
    ],
    "test/file1.js": [
        {
            "line": 0,
            "type": "TODO",
            "value": "test"
        }
    ]
}
```

## License

MIT ©2014 **Vsevolod Rodionov**
