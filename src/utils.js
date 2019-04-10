/**
 * Taken from: https://bl.ocks.org/mbostock/7555321
 **/
function wrap(text, width) {
    text.each(function() {
        var text = d3.select(this),
            words = text.
        text().
        split(/\s+/).
        reverse(),
            word,
            line = [],
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy"));

        dy = isNaN(dy) ? 1 : dy;
        var tspan = text.
        text(null).
        append("tspan").
        attr("x", 0).
        attr("y", y).
        attr("dy", dy + "em");

        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.
                append("tspan").
                attr("x", 0).
                attr("y", y).
                attr("dy", dy + "em").
                text(word);
            }
        }
    });
}

export { wrap };