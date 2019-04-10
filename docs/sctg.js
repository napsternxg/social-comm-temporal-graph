(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = global || self, global.sctg = factory());
}(this, function () { 'use strict';

    function computeLayout() {
        var top_config = {};
        var bottom_config = {};
        var time_config = {};

        function setScaleDomain(scale, key_fn, data) {
            const domain = d3.extent(data.map(key_fn));
            return scale.domain(domain);
        }

        var compute = function(data, config) {
            /**
                                                 * data: should be same as network_data
                                                 * config should have following structure:
                                                 * {top: {}, bottom: {}}
                                                 * both top and bottom values should have following structure:
                                                 * {
                                                     y_fn: d => d.attr,
                                                        size_fn: d => d.attr,
                                                        color_fn: d => d.attr,
                                                        y_scale: scale, 
                                                        size_scale: scale,
                                                        color_scale: scale,
                                                    }
                                                    */
            //debugger;
            // Get common time data to create common x axis
            const common_time_data = data.flatMap((d) =>
                d3.merge([
                    [top_config.time_key_fn(d.value)],
                    d.value.items.map(bottom_config.time_key_fn)
                ]));


            var time_scale = setScaleDomain(
                time_config.scale,
                d => d,
                common_time_data);


            // Create an array of bottom nodes for computation of domain of bottom nodes.

            var bottom_nodes = data.flatMap(d => d.value.items);

            var bottom_y_scale = setScaleDomain(
                config.bottom.y_scale,
                config.bottom.y_fn,
                bottom_nodes);

            var bottom_size_scale = setScaleDomain(
                config.bottom.size_scale,
                config.bottom.size_fn,
                bottom_nodes);


            var top_y_scale = setScaleDomain(
                config.top.y_scale,
                config.top.y_fn,
                data.map(d => d.value));

            var top_size_scale = setScaleDomain(
                config.top.size_scale,
                config.top.size_fn,
                data.map(d => d.value));


            var setBottomNodeLayout = function(items) {
                const itemsWithLayout = items.map(d => {
                    const layout = {
                        x: time_config.scale(bottom_config.time_key_fn(d)),
                        y: bottom_y_scale(config.bottom.y_fn(d)),
                        size: bottom_size_scale(config.bottom.size_fn(d))
                    };

                    d = {
                        ...d
                    }; // Always return a copy don't modify original object
                    d.layout = layout;
                    return d;
                });
                return itemsWithLayout;
            };

            var nodes = data.map(d => {
                d = {
                    ...d
                }; // Always return a copy don't modify original object
                var value = d.value;
                var layout = {
                    x: time_config.scale(top_config.time_key_fn(value)),
                    y: top_y_scale(config.top.y_fn(value)),
                    size: top_size_scale(config.top.size_fn(value))
                };

                value.layout = layout;
                value.items = setBottomNodeLayout(value.items);
                d.value = value;
                return d;
            });

            var edges = nodes.flatMap((d) =>
                d.value.items.map(item => {
                    return {
                        source: {
                            x: item.layout.x,
                            y: item.layout.y
                        },
                        target: {
                            x: d.value.layout.x,
                            y: d.value.layout.y
                        }
                    };

                }));


            return {
                nodes: nodes,
                edges: edges,
                scales: {
                    time_scale: time_scale,
                    bottom_y_scale: bottom_y_scale,
                    top_y_scale: top_y_scale
                }
            };


        };

        compute.topNodeKey = function(key_fn) {
            top_config.key_fn = key_fn;
            return this;
        };

        compute.topTimeKey = function(key_fn) {
            top_config.time_key_fn = key_fn;
            return this;
        };

        compute.bottomTimeKey = function(key_fn) {
            bottom_config.time_key_fn = key_fn;
            return this;
        };

        compute.timeScale = function(scale) {
            time_config.scale = scale;
            return this;
        };

        compute.plotOffset = function(offset) {
            return this;
        };

        compute.topReduce = function(reduce_fn) {
            top_config.reduce_fn = reduce_fn;
            return this;
        };

        return compute;
    }

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

    function draw(sctg_layout_values, svg, logDiv, config, style_config) {
        const topTooltip = d3.
        tip().
        attr("class", "d3-tip").
        offset([0, 0]).
        html(config.top.toolTipContent);

        const bottomTooltip = d3.
        tip().
        attr("class", "d3-tip").
        offset([0, 0]).
        html(config.bottom.toolTipContent);

        svg.call(topTooltip);
        svg.call(bottomTooltip);

        const top_nodes = svg.
        append("g").
        attr("stroke", "#fff").
        attr("stroke-width", 0).
        selectAll("g").
        data(sctg_layout_values.nodes).
        join("g").
        attr("class", "node");

        top_nodes.
        append("g").
        attr("class", "top-node").
        append("circle").
        attr("r", d => d.value.layout.size).
        attr("cx", d => d.value.layout.x).
        attr("cy", d => d.value.layout.y).
        attr("fill", config.top.color_fn).
        attr("opacity", 0.3).
        on("mouseover", function(d) {
            topTooltip.show(d, this);
            const parent = d3.select(this.parentNode.parentNode);
            parent.classed("node-focus", true);
        }).
        on("mouseleave", function(d) {
            topTooltip.hide(d);
            const parent = d3.select(this.parentNode.parentNode);
            parent.classed("node-focus", false);
        }).
        on("click", d => logDiv.html(config.top.toolTipContent(d)));

        const bottom_nodes = top_nodes.
        append("g").
        attr("class", "bottom-node").
        selectAll("circle").
        data(d => d.value.items).
        join("circle").
        attr("r", d => d.layout.size).
        attr("cx", d => d.layout.x).
        attr("cy", d => d.layout.y).
        attr("fill", config.bottom.color_fn).
        attr("opacity", 0.3).
        on("mouseover", function(d) {
            bottomTooltip.show(d, this);
            const parent = d3.select(this.parentNode.parentNode);
            parent.classed("node-focus", true);
        }).
        on("mouseleave", function(d) {
            bottomTooltip.hide(d);
            const parent = d3.select(this.parentNode.parentNode);
            parent.classed("node-focus", false);
        }).
        on("click", d => logDiv.html(config.bottom.toolTipContent(d)));

        const edges = top_nodes.
        append("g").
        attr("class", "link").
        attr("stroke", "#999").
        attr("stroke-opacity", 0.6).
        selectAll("line").
        data(d => {
            return d.value.items.map(item => {
                return {
                    source: {
                        x: d.value.layout.x,
                        y: d.value.layout.y
                    },
                    target: {
                        x: item.layout.x,
                        y: item.layout.y
                    }
                };

            });
        }).
        join("line").
        attr("x1", d => d.source.x).
        attr("y1", d => d.source.y).
        attr("x2", d => d.target.x).
        attr("y2", d => d.target.y).
        attr("stroke-width", 0.1);

        svg.
        append("g").
        attr("class", "axis axis--y").
        attr(
            "transform",
            "translate(" + (
                sctg_layout_values.scales.time_scale.range()[0] - 10) +
            ", 0)").

        call(
            d3.axisLeft(sctg_layout_values.scales.bottom_y_scale).tickFormat(d3.format(".0s")));


        svg.
        append("g").
        attr("class", "axis axis--y").
        attr(
            "transform",
            "translate(" + (
                sctg_layout_values.scales.time_scale.range()[1] + 10) +
            ", 0)").

        call(
            d3.axisRight(sctg_layout_values.scales.bottom_y_scale).tickFormat(d3.format(".0s")));


        svg.
        append("g").
        attr("class", "axis axis--y").
        attr(
            "transform",
            "translate(" + (
                sctg_layout_values.scales.time_scale.range()[0] - 10) +
            ", 0)").

        call(
            d3.axisLeft(sctg_layout_values.scales.top_y_scale).tickFormat(d3.format(".0s")));


        svg.
        append("g").
        attr("class", "axis axis--y").
        attr(
            "transform",
            "translate(" + (
                sctg_layout_values.scales.time_scale.range()[1] + 10) +
            ", 0)").

        call(
            d3.axisRight(sctg_layout_values.scales.top_y_scale).tickFormat(d3.format(".0s")));


        svg.
        append("g").
        attr("class", "axis axis--x").
        attr(
            "transform",
            "translate(0," + (
                sctg_layout_values.scales.top_y_scale.range()[0] + 10) +
            ")").

        call(d3.axisBottom(sctg_layout_values.scales.time_scale));

        svg.
        append("g").
        attr("class", "axis axis--x").
        attr(
            "transform",
            "translate(0," + (
                sctg_layout_values.scales.bottom_y_scale.range()[0] + 10) +
            ")").

        call(d3.axisBottom(sctg_layout_values.scales.time_scale));

        // Time text

        svg.
        append("text").
        attr(
            "transform",
            "translate(" +
            sctg_layout_values.scales.time_scale.range()[1] / 2 +
            " ," + (
                sctg_layout_values.scales.bottom_y_scale.range()[0] + 50) +
            ")").

        style("text-anchor", "middle").
        style("font-weight", "bolder").
        style("font-size", "x-large").
        text(style_config.time_axis_label);

        // Top texts
        svg.
        append("text").
        attr(
            "transform",
            "translate(" + (
                sctg_layout_values.scales.time_scale.range()[0] - 100) +
            " ," +
            sctg_layout_values.scales.top_y_scale.range()[1] +
            ")").

        style("text-anchor", "middle").
        style("font-weight", "bolder").
        style("font-size", "x-large").
        text(style_config.top.title).
        call(wrap, 300);

        svg.
        append("text").
        attr(
            "transform",
            "translate(" + (
                sctg_layout_values.scales.time_scale.range()[1] + 50) +
            " ," +
            sctg_layout_values.scales.top_y_scale.range()[1] +
            ")").

        style("text-anchor", "left").
        style("font-weight", "bolder").
        style("font-size", "large").
        text(`y=${style_config.top.y_axis_label}`).
        call(wrap, 200);

        svg.
        append("text").
        attr(
            "transform",
            "translate(" + (
                sctg_layout_values.scales.time_scale.range()[1] + 50) +
            " ," + (
                sctg_layout_values.scales.top_y_scale.range()[1] + 100) +
            ")").

        style("text-anchor", "left").
        style("font-weight", "bolder").
        style("font-size", "large").
        text(`size=${style_config.top.size_label}`).
        call(wrap, 200);

        //Bottom texts

        svg.
        append("text").
        attr(
            "transform",
            "translate(" + (
                sctg_layout_values.scales.time_scale.range()[0] - 100) +
            " ," +
            sctg_layout_values.scales.bottom_y_scale.range()[1] +
            ")").

        style("text-anchor", "middle").
        style("font-weight", "bolder").
        style("font-size", "x-large").
        text(style_config.bottom.title).
        call(wrap, 80);

        svg.
        append("text").
        attr(
            "transform",
            "translate(" + (
                sctg_layout_values.scales.time_scale.range()[1] + 50) +
            " ," +
            sctg_layout_values.scales.bottom_y_scale.range()[1] +
            ")").

        style("text-anchor", "left").
        style("font-weight", "bolder").
        style("font-size", "large").
        text(`y=${style_config.bottom.y_axis_label}`).
        call(wrap, 200);

        svg.
        append("text").
        attr(
            "transform",
            "translate(" + (
                sctg_layout_values.scales.time_scale.range()[1] + 50) +
            " ," + (
                sctg_layout_values.scales.bottom_y_scale.range()[1] + 100) +
            ")").

        style("text-anchor", "left").
        style("font-weight", "bolder").
        style("font-size", "large").
        text(`size=${style_config.bottom.size_label}`).
        call(wrap, 200);
    }

    var index = {
        computeLayout: computeLayout, 
        draw: draw 
    };

    return index;

}));
