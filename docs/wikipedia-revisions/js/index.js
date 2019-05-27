const strictIsoParse = d3.utcParse("%Y-%m-%dT%H:%M:%SZ");

function getParsedData(data) {
  const page_id = Object.keys(data["query"]["pages"])[0];
  const parsed_json = data["query"]["pages"][page_id];
  const title = parsed_json["title"];
  const revisions = parsed_json["revisions"].map(d => {
    return {
      id: d["revid"],
      user: d["user"],
      size: +d["size"],
      timestamp: strictIsoParse(d["timestamp"]),
      parsedcomment: d["parsedcomment"],
      title: title
    };
  });
  return revisions;
}

function getTitleInput(){
	var wiki_title_input_1 = d3.select("#wiki-title-input-1").property("value");
	var wiki_title_input_2 = d3.select("#wiki-title-input-2").property("value");
	const title_input = [
		wiki_title_input_1,
		wiki_title_input_2,
	].filter(x => x);
	console.log(title_input);
	var url = new URL(window.location.href);
	var search_params = new URLSearchParams();
	for(var i=0; i<title_input.length; i++){
		search_params.set(`wiki_title_input_${i+1}`, title_input[i]);
	}
	url.search = search_params.toString();
	history.replaceState(null, "", url.search.toString());
	return title_input;
}

function createWikiPlot(callback) {
  /**
   * To fetch data from wikipedia API, we need to add origin=* to the get parameter request
   **/
  if (callback) callback();
  const title_input = getTitleInput()
  const data_promises = Promise.all(
    title_input.map(title => {
      const URL =
        `https://en.wikipedia.org/w/api.php?action=query&prop=revisions&titles=${encodeURIComponent(title)}&rvlimit=500&rvprop=timestamp%7Cuser%7Csize%7Cparsedcomment%7Cids&format=json&origin=*`;
      console.log(title, URL);
      return d3.json(URL);
    })
  );

  const data = data_promises.then((data_arr) => {
    console.log(`Found data:\n ${data_arr}`);
    d3.select("#page-title").text(title_input.join(" and "));
    const revisions = [].concat.apply([], data_arr.map(getParsedData));
    createPlot(revisions, title_input);
  }).catch(error => {
    console.log(error);
    d3.select("#error-logs").html(`
<div class="alert alert-danger" role="alert">
<p>Error fetching data for<br/>
title: ${title_input}<br/>
using URL: ${URL}.<br/>
See console for details.</p>
</div>`);
    throw error;
  });

}

function createPlot(revisions, title_input) {
  const parsed_data = revisions;
  const width = 1500;
  const height = 900;
  const plot_sizes = {
    top: 500,
    bottom: 150,
    offset: 50
  };

  const margin = {
    top: 50,
    bottom: 50,
    left: 50,
    right: 400
  };

  var time_scale = d3.scaleTime().range([margin.left, width - margin.right]);

  function reduce_fn(items) {
    return {
      count: items.length,
      time_first_occurence: d3.min(items, v => v.timestamp),
      total_size: d3.sum(items, v => v.size),
      items: items,
      title_counts: d3.nest().key(d => d.title).rollup(di => di.length).entries(
        items)
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
      y_axis_label: "Size of revision",
      size_label: "Size of revision"
    }
  };

  function getTopColorScale(title_input){
	  var range = [
		d3.color("Crimson").darker(), 
		d3.color("DarkOliveGreen").darker()
	  ]
	  const domain = title_input.length == 1 ? title_input : [].concat(["Both"], title_input);
	  range = title_input.length == 1 ? range : [].concat([d3.color("DodgerBlue").darker()], range);
	  console.log(domain, range);
	  return d3.scaleOrdinal()
				.domain(domain)
				.range(range);
	  
  }
  
  var topColorScale = getTopColorScale(title_input);

  var getTopColor = title_counts => {
    var x = title_counts.length > 1 ? "Both" : title_counts[0].key;
    return topColorScale(x);
  };

  var bottomColorScale = d3.scaleOrdinal()
    .domain(title_input)
    .range([
		d3.color("Crimson").brighter(), 
		d3.color("DarkOliveGreen").brighter()
	]);

  var topToolTipKeyValues = function(entries) {
    return entries.map(d => `
    <strong style="color: ${bottomColorScale(d.key)}">${d.key}:</strong> ${d.value}
    `).join("<br/>");
  }

  var getTopTooltipContent = function(d) {
    console.log(d);
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
	<strong>First Occurence: </strong> ${d.value.time_first_occurence}<br/>
  ${topToolTipKeyValues(d.value.title_counts)}
  </p>
  <p></p>
</div>
</div>
`;
  };

  var getBottomTooltipContent = function(d) {
    return `
<div class="card">
<h5 class="card-header">${style_config.bottom.title}: ${d.title}</h5>
<div class="card-body">
  <h5 class="card-title">User: <a href="http://en.wikipedia.org/w/index.php?title=User:${
d.user
}">${d.user}</a></h5>
  <p class="card-text">
	<strong>Revision Size: </strong> ${d.size}<br/>
	<strong>Created at: </strong> <a href="http://en.wikipedia.org/w/index.php?title=${d.title}&oldid=${
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
    color_fn: d => getTopColor(d.value.title_counts),
    y_scale: d3.scaleLog().range([0, -plot_sizes.top]),
    size_scale: d3.scaleLinear().range([6, 12]),
    toolTipContent: getTopTooltipContent
  };

  const bottom_config = {
    y_fn: d => d.size,
    size_fn: d => d.size,
    color_fn: d => bottomColorScale(d.title),
    y_scale: d3.
    scaleLinear().
    range([plot_sizes.bottom + plot_sizes.offset, plot_sizes.offset]),
    size_scale: d3.scaleLinear().range([2, 6]),
    toolTipContent: getBottomTooltipContent
  };

  const config = {
    top: top_config,
    bottom: bottom_config
  };

  sctg_layout = sctg.computeLayout().
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
		-margin.left - 80,
		-height + (plot_sizes.top + plot_sizes.bottom) / 2,
		width,
		height
	]).

  style("background-color", "gainsboro");

  svg.selectAll("*").remove();

  const logDiv = mainDiv.select("div.log-data");

  sctg.draw(sctg_layout_values, svg, logDiv, config, style_config);

  svg.append("g")
    .classed("legend", true)
    .attr("transform", `translate(
    ${sctg_layout_values.scales.time_scale.range()[1]+50}, 
    ${sctg_layout_values.scales.bottom_y_scale.range()[1]-100})`)
    .attr("font-size", "large")
    .call(
      d3.legendColor()
      .title("Bottom node colors")
      .scale(bottomColorScale)
    );

  svg.append("g")
    .classed("legend", true)
    .attr("transform", `translate(
    ${sctg_layout_values.scales.time_scale.range()[1]+50}, 
    ${sctg_layout_values.scales.top_y_scale.range()[1]+200})`)
    .attr("font-size", "large")
    .call(
      d3.legendColor()
      .title("Top node colors")
      .scale(topColorScale)
    );

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
  const current_url = new URL(window.location.href);
  const params = current_url.searchParams;
  console.log(params.get("wiki_title_input_1"), params.get("wiki_title_input_2"));
  var wiki_title_input_1 = params.get("wiki_title_input_1");
  var wiki_title_input_2 = params.get("wiki_title_input_2");
  if(!wiki_title_input_1 && !wiki_title_input_2){
	  wiki_title_input_1 = "Narendra Modi";
	  wiki_title_input_2 = "Rahul Gandhi";
  }
  console.log(wiki_title_input_1, wiki_title_input_2);
  d3.select("#wiki-title-input-1").property("value", wiki_title_input_1);
  d3.select("#wiki-title-input-2").property("value", wiki_title_input_2);
  console.log("Creating initial wikiplot");
  createWikiPlot(callback);
})();