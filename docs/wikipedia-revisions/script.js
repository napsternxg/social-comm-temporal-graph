function createWikiPlot(callback) {
	/**
	 * To fetch data from wikipedia API, we need to add origin=* to the get parameter request
	 **/
	const title_input = d3.select("#wiki-title-input").property("value");
	console.log(title_input);
	const URL = `https://en.wikipedia.org/w/api.php?action=query&prop=revisions&titles=${encodeURIComponent(
title_input)
}&rvlimit=500&rvprop=timestamp%7Cuser%7Csize%7Cparsedcomment%7Cids&format=json&origin=*`;
	console.log(URL);
	const data = d3.json(URL);
	data
		.then(value => {
			d3.select("#page-title").text(title_input);
			createPlot(value);
			if(callback) callback();
		})
		.catch((e) => {
			console.log(e);
			d3.select("#error-logs").html(`
			<div class="alert alert-warning" role="alert">
			Error fetching data for title: ${title_input} using URL: ${URL}. See console for details.
			</div>`);
		});
}

function createPlot(data) {
	const strictIsoParse = d3.utcParse("%Y-%m-%dT%H:%M:%SZ");
	const page_id = Object.keys(data["query"]["pages"])[0];
	//console.log(data);
	const parsed_json = data["query"]["pages"][page_id];
	const title = parsed_json["title"];
	d3.select("page-title").text(title);
	const revisions = parsed_json["revisions"];
	const parsed_data = revisions.map(d => {
		return {
			id: d["revid"],
			user: d["user"],
			size: +d["size"],
			timestamp: strictIsoParse(d["timestamp"]),
			parsedcomment: d["parsedcomment"]
		};

	});

	const width = 1500;
	const height = 900;
	const plot_sizes = {
		top: 500,
		bottom: 150,
		offset: 50
	};

	const margin = {
		top: 100,
		bottom: 100,
		left: 100,
		right: 500
	};

	var time_scale = d3.scaleTime().range([margin.left, width - margin.right]);

	function reduce_fn(items) {
		return {
			count: items.length,
			time_first_occurence: d3.min(items, v => v.timestamp),
			total_size: d3.sum(items, v => v.size),
			items: items
		};

	}

	const network_data = d3.
	nest().
	key(d => d.user).
	rollup(reduce_fn).
	entries(parsed_data);

	const style_config = {
		time_axis_label: "Date",
		top: {
			title: "Users",
			y_axis_label: "Number of revisions",
			size_label: "Total revision size"
		},

		bottom: {
			title: "Revisions",
			y_axis_label: "Size of revision (bytes)",
			size_label: "Size of revision"
		}
	};



	var getTopTooltipContent = function(d) {
		return `
<div class="card">
<h5 class="card-header">${style_config.top.title}</h5>
<div class="card-body">
  <h5 class="card-title">User: <a href="http://en.wikipedia.org/w/index.php?title=User:${
d.key
}">${d.key}</a></h5>
  <p class="card-text">
	<strong>Total Revisions: </strong> ${d.value.count}<br/>
	<strong>Total Revision Size: </strong> ${d.value.total_size}<br/>
	<strong>First Occurence: </strong> ${
d.value.time_first_occurence
}<br/>
  </p>
  <p></p>
</div>
</div>
`;
	};

	var getBottomTooltipContent = function(d) {
		return `
<div class="card">
<h5 class="card-header">${style_config.bottom.title}</h5>
<div class="card-body">
  <h5 class="card-title">User: <a href="http://en.wikipedia.org/w/index.php?title=User:${
d.user
}">${d.user}</a></h5>
  <p class="card-text">
	<strong>Revision Size: </strong> ${d.size}<br/>
	<strong>Created at: </strong> <a href="http://en.wikipedia.org/w/index.php?title=${title}&oldid=${
d.id
}"">${d.timestamp}</a><br/>
	<strong>Comment: </strong> ${d.parsedcomment}<br/>
  </p>
</div>
</div>
`;
	};

	const top_config = {
		y_fn: d => d.count,
		size_fn: d => d.total_size,
		color_fn: d => "DodgerBlue",
		y_scale: d3.scaleLog().range([0, -plot_sizes.top]),
		size_scale: d3.scaleLog().range([3, 10]),
		toolTipContent: getTopTooltipContent
	};

	const bottom_config = {
		y_fn: d => d.size,
		size_fn: d => d.size,
		color_fn: d => "Crimson",
		y_scale: d3.
		scaleLinear().
		range([plot_sizes.bottom + plot_sizes.offset, plot_sizes.offset]),
		size_scale: d3.scaleLog().range([2, 6]),
		toolTipContent: getBottomTooltipContent
	};


	const config = {
		top: top_config,
		bottom: bottom_config
	};


	sctg_layout = sctg().
	topNodeKey(d => d.user).
	topTimeKey(d => d.time_first_occurence).
	bottomTimeKey(d => d.timestamp).
	timeScale(time_scale).
	topReduce(reduce_fn);

	const sctg_layout_values = sctg_layout(network_data, config);

	const mainDiv = d3.select("div.main");

	const svg = mainDiv.
	select("svg").
	attr("width", width).
	attr("height", height).
	attr("viewBox", [
		-margin.left,
		-height + (plot_sizes.top + plot_sizes.bottom) / 2,
		width,
		height
	]).

	style("background-color", "gainsboro");

	svg.selectAll("*").remove();

	const logDiv = mainDiv.select("div.log-data");

	draw(sctg_layout_values, svg, logDiv, config, style_config);
}

(() => {
	const callback = () => {
		d3.select("#plot-sctg").on("click", () => {
			d3.
			select("div.main svg").
			selectAll("*").
			remove();
			createWikiPlot();
		});
	};
	console.log("Creating initial wikiplot");
	createWikiPlot(callback);
})();