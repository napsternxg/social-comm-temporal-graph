import { wrap } from "./utils.js";

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

export { draw };