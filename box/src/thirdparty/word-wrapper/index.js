var newline = /\n/
var newlineChar = '\n'
var whitespace = /[\u0009\u0020(\r|\n|\r\n)]/ // /\s/

var bulletRegex = /[\u2022\u2023\u25E6\u2043\u2219]/
const kBulletedIndent = 3;

module.exports = function(text, opt) {
    var lines = module.exports.lines(text, opt)
    return lines.map(function(line) {
        return text.substring(line.start, line.end)
    }).join('\n')
}

module.exports.lines = function wordwrap(text, opt) {
    opt = opt||{}

    //zero width results in nothing visible
    if (opt.width === 0 && opt.mode !== 'nowrap') 
        return []

    text = text||''
    var width = typeof opt.width === 'number' ? opt.width : Number.MAX_VALUE
    var start = Math.max(0, opt.start||0)
    var end = typeof opt.end === 'number' ? opt.end : text.length
    var mode = opt.mode

    var measure = opt.measure || monospace
    if (mode === 'pre')
        return pre(measure, text, start, end, width)
    else
        return greedy(measure, text, start, end, width, mode)
}

function idxOf(text, chr, start, end) {
    var idx = text.indexOf(chr, start)
    if (idx === -1 || idx > end)
        return end
    return idx
}

function isWhitespace(chr) {
    return whitespace.test(chr)
}

function isBullet(chr) {
    return bulletRegex.test(chr);
}

function pre(measure, text, start, end, width) {
    var lines = []
    var lineStart = start
    for (var i=start; i<end && i<text.length; i++) {
        var chr = text.charAt(i)
        var isNewline = newline.test(chr)

        //If we've reached a newline, then step down a line
        //Or if we've reached the EOF
        if (isNewline || i===end-1) {
            var lineEnd = isNewline ? i : i+1
            var measured = measure(text, lineStart, lineEnd, width)
            lines.push(measured)
            
            lineStart = i+1
        }
    }
    return lines
}

function greedy(measure, text, start, end, width, mode) {
    //A greedy word wrapper based on LibGDX algorithm
    //https://github.com/libgdx/libgdx/blob/master/gdx/src/com/badlogic/gdx/graphics/g2d/BitmapFontCache.java
    var lines = []

    var testWidth = width
    //if 'nowrap' is specified, we only wrap on newline chars
    if (mode === 'nowrap')
        testWidth = Number.MAX_VALUE
    
    var testWidthBulleted = Math.max(width - kBulletedIndent, 1);

    let isBulleted = false;
    let bulletedLineCount = 0;
    let bulletIndent = 0.0;
    while (start < end && start < text.length) {
        //get next newline position
        var newLine = idxOf(text, newlineChar, start, end)

        let originalStart = start;

        //eat whitespace at start of line
        while (start < newLine) {
            if (!isWhitespace( text.charAt(start) ))
                break
            start++
        }


        // If this line starts with a bullet, keep leading whitespace
        if(isBullet(text.charAt(start)))
        {
            // Compute the offset 
            let trailingSpaces = 0;
            if ((start+1) < newLine && isWhitespace(text.charAt(start+1)))
            {
                trailingSpaces = 1;
                while(start+trailingSpaces+1 < newLine)
                {
                    if (!isWhitespace(text.charAt(start+trailingSpaces+1)))
                        break;
                    trailingSpaces++;
                }
            }
            let indentMeasure = measure(text, originalStart, start+trailingSpaces+1, Number.MAX_VALUE);
            bulletIndent = indentMeasure.penWidth;
            start = originalStart;
            isBulleted = true;
            bulletedLineCount = 1;
        }
        else if (isBulleted)
        {
            bulletedLineCount++;
        }

        // @DH - if we detect a bullet, remember that we're in a bulleted state until the next newline.
        // After each line-break while in bulleted state, add a prefix of empty space to inset the line.
        // Just pass a smaller width to the "measure" pass and then include a "prefix indent" to the returned
        // struct. Then, when generating the geoemtry, we can add the indent.

        //determine visible # of glyphs for the available width
        var measured = measure(text, start, newLine, testWidth)

        var lineEnd = start + (measured.end-measured.start)
        var nextStart = lineEnd + newlineChar.length

        //if we had to cut the line before the next newline...
        let endingOnNewline = true;
        if (lineEnd < newLine) {
            

            //find char to break on
            while (lineEnd > start) {
                if (isWhitespace(text.charAt(lineEnd)))
                    break
                lineEnd--
            }
            if (lineEnd === start) {
                if (nextStart > start + newlineChar.length) nextStart--
                lineEnd = nextStart // If no characters to break, show all.
            } else {
                endingOnNewline = false;

                nextStart = lineEnd
                //eat whitespace at end of line
                while (lineEnd > start) {
                    if (!isWhitespace(text.charAt(lineEnd - newlineChar.length)))
                        break
                    lineEnd--
                }
            }
        }
        if (lineEnd >= start) {
            var result = measure(text, start, lineEnd, isBulleted ? testWidthBulleted : testWidth);
            if (bulletedLineCount > 1)
            {
                result.indent = bulletIndent;
            }
            lines.push(result)
        }

        if(endingOnNewline)
        {
            isBulleted = false;
            bulletedLineCount = 0;
            bulletIndent = 0.0;
        }

        start = nextStart
    }
    return lines
}

//determines the visible number of glyphs within a given width
function monospace(text, start, end, width) {
    var glyphs = Math.min(width, end-start)
    return {
        start: start,
        end: start+glyphs
    }
}