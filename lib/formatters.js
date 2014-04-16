module.exports = {
    human: function humanFormatter(commentsArray) {
        var fileCommentsObject = {};
        commentsArray.forEach(function (record) {
            fileCommentsObject['line ' + record.line] = record.type + ': ' + record.value;
        });
        return fileCommentsObject;
    },
    robot: function robotFormatter(commentsArray) {
        return commentsArray;
    }
};
module.exports.default = module.exports.human;