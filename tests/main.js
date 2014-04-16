var todo = require('../'),
    should = require('should'),
    path = require('path'),
    File = require('gulp-util').File,
    Buffer = require('buffer').Buffer;

require('mocha');

describe('gulp-todo', function () {
    describe('todo()', function () {
        var input;

        input = ['wadup'];
        testFiles(todo, [], input, {});
        testFiles(todo, [{formatter: 'robot'}], input, {});
        testFiles(todo, [{formatter: 'human'}], input, {});

        input = ['//todo test'];
        testFiles(todo, [], input, {"test/file0.js":{"line 0":"TODO: test"}});
        testFiles(todo, [{formatter: 'human'}], input, {"test/file0.js":{"line 0":"TODO: test"}});
        testFiles(todo, [{formatter: 'robot'}], input, {"test/file0.js":[{line:0,type:"TODO",value:"test"}]});

        input = ['//- todo test'];
        testFiles(todo, [], input, {"test/file0.js":{"line 0":"TODO: test"}});
        testFiles(todo, [{formatter: 'human'}], input, {"test/file0.js":{"line 0":"TODO: test"}});
        testFiles(todo, [{formatter: 'robot'}], input, {"test/file0.js":[{line:0,type:"TODO",value:"test"}]});

        input = ['#todo test'];
        testFiles(todo, [], input, {"test/file0.js":{"line 0":"TODO: test"}});
        testFiles(todo, [{formatter: 'human'}], input, {"test/file0.js":{"line 0":"TODO: test"}});
        testFiles(todo, [{formatter: 'robot'}], input, {"test/file0.js":[{line:0,type:"TODO",value:"test"}]});

        input = ['//fixme test'];
        testFiles(todo, [], input, {"test/file0.js":{"line 0":"FIXME: test"}});
        testFiles(todo, [{formatter: 'human'}], input, {"test/file0.js":{"line 0":"FIXME: test"}});
        testFiles(todo, [{formatter: 'robot'}], input, {"test/file0.js":[{line:0,type:"FIXME",value:"test"}]});

        input = ['//todo test', '//todo test'];
        testFiles(todo, [], input, {"test/file0.js":{"line 0":"TODO: test"},"test/file1.js":{"line 0":"TODO: test"}});
        testFiles(todo, [{formatter: 'human'}], input, {"test/file0.js":{"line 0":"TODO: test"},"test/file1.js":{"line 0":"TODO: test"}});
        testFiles(todo, [{formatter: 'robot'}], input, {"test/file0.js":[{line:0,type:"TODO",value:"test"}], "test/file1.js":[{line:0,type:"TODO",value:"test"}]});

        function testFiles(streamInitialiser, args, contentses, result) {
            var stream = streamInitialiser.apply(this, args);
            it('should detect todos in one or several files with args: '+JSON.stringify(args), function (done) {
                stream.on('data', function (newFile) {
                    should.exist(newFile);
                    should.exist(newFile.path);
                    should.exist(newFile.relative);
                    should.exist(newFile.contents);

                    var newFilePath = path.resolve(newFile.path),
                        expectedFilePath = path.resolve('~/todo.json');
                    newFilePath.should.equal(expectedFilePath);

                    newFile.relative.should.equal('todo.json');
                    JSON.stringify(JSON.parse(String(newFile.contents))).should.equal(JSON.stringify(result));
                    Buffer.isBuffer(newFile.contents).should.equal(true);
                    done();
                });

                contentses.forEach(function (contents, i) {
                    stream.write(new File({
                        cwd: path.resolve('~/'),
                        base: path.resolve('~/test'),
                        path: path.resolve('~/test/file' + i.toString() + '.js'),
                        contents: new Buffer(contents)
                    }));
                });

                stream.end();
            });
        }
    });
});