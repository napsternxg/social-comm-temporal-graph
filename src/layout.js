function computeLayout() {
    var top_config = {};
    var bottom_config = {};
    var layout_config = {};
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
        layout_config.plot_offset = offset;
        return this;
    };

    compute.topReduce = function(reduce_fn) {
        top_config.reduce_fn = reduce_fn;
        return this;
    };

    return compute;
}

export { computeLayout };