function commonExtractor(file, enc){
    var rCommentsValidator = /(?:(?:\/\/)|\#)[-–—]*\s*(TODO|FIXME)\s*(.*)$/igm; //test for comments that have todo/fixme + text
    return file.contents.toString(enc).split('\n').map(function (line, index) {
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
}

function extractorProxy(file, enc){
    return commonExtractor(file, enc);
}

module.exports = function (file, enc) { //for possible various parser engines
    try {
        return extractorProxy(file, enc);
    } catch (e) {
        return [];
    }
};