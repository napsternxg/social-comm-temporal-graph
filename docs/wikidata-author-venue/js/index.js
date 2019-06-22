const strictIsoParse = d3.timeParse("%Y-%m-%d");
const timeFormatter = d3.timeFormat("%B %d, %Y");


function getQueryURL(author_id, return_interfaceURL){
  const query = `
#defaultView:Table
SELECT
  (MIN(?dates) AS ?date)
  ?work ?workLabel
  (GROUP_CONCAT(DISTINCT ?type_label; separator=", ") AS ?type)
  (SAMPLE(?pages_) AS ?pages)
  ?venue ?venueLabel
  (GROUP_CONCAT(DISTINCT ?author_label; separator=", ") AS ?authors)
WHERE {
  ?work wdt:P50 wd:${author_id} .
  ?work wdt:P50 ?author .
  OPTIONAL {
    ?author rdfs:label ?author_label_ . FILTER (LANG(?author_label_) = 'en')
  }
  BIND(COALESCE(?author_label_, SUBSTR(STR(?author), 32)) AS ?author_label)
  OPTIONAL { ?work wdt:P31 ?type_ . ?type_ rdfs:label ?type_label . FILTER (LANG(?type_label) = 'en') }
  OPTIONAL {
    ?work wdt:P577 ?datetimes .
    BIND(xsd:date(?datetimes) AS ?dates)
  }
  OPTIONAL { ?work wdt:P1104 ?pages_ }
  { ?work wdt:P1433 ?venue }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,da,de,es,fr,jp,no,ru,sv,zh". }  
}
GROUP BY ?work ?workLabel ?venue ?venueLabel
ORDER BY DESC(?date)    
 `;
      const URL = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json&origin=*`;
  const interfaceURL = `https://query.wikidata.org/#${encodeURIComponent(query)}`;
  if(return_interfaceURL) return interfaceURL;
  return URL;
}

function getParsedData(data, author) {
  const parsed_json = data["results"]["bindings"];
  const papers = parsed_json.map(d => {
    const all_authors = d["authors"]["value"].split(", ");
    return {
      id: d["work"]["value"],
      venue: {
        "venue_id": d["venue"]["value"],
        "venue_label": d["venueLabel"]["value"],
      },
      size: 1,
      timestamp: strictIsoParse(d["date"]["value"]),
      paper_title: d["workLabel"]["value"],
      author: author,
      all_authors: all_authors,
      num_authors: all_authors.length
    };
  });
  return papers;
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
      const URL = getQueryURL(title);
      console.log(title, URL);
      return d3.json(URL);
    })
  );

  const data = data_promises.then((data_arr) => {
    console.log(`Found data:\n ${data_arr}`);
    d3.select("#page-title").html(
      title_input.map(t => `<a href="${getQueryURL(t, true)}">${t}</a>`).join(" and ")
    );
    const papers = [].concat.apply([], data_arr.map(
      (data, i) => getParsedData(data, title_input[i])
    ));
    createPlot(papers, title_input);
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

function createPlot(papers, title_input) {
  console.log(papers)
  const parsed_data = papers;
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
    const time_range = d3.extent(items, v => v.timestamp);
    const unique_years = new Set(items.map(v => v.timestamp.getFullYear()));
    return {
      count: items.length,
      time_first_occurence: time_range[0],
      time_last_occurence: time_range[1],
      unique_years: unique_years.size,
      time_span: d3.timeYear.count(time_range[0], time_range[1]),
      total_size: d3.sum(items, v => v.size),
      items: items,
      title_counts: d3.nest().key(d => d.author).rollup(di => di.length).entries(
        items),
      venue_label: items[0].venue.venue_label
    };

  }

  const network_data = d3.
  nest().
  key(d => d.venue.venue_id).
  rollup(reduce_fn).
  entries(parsed_data);

  const style_config = {
    time_axis_label: "Date",
    top: {
      title: "Venues",
      y_axis_label: "Number of papers",
      size_label: "Number of unique years"
    },
    bottom: {
      title: "Papers",
      y_axis_label: "Number of authors",
      size_label: "Number of authors"
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
  <h5 class="card-title">User: <a href="https://www.wikidata.org/wiki/${d.key}">${d.value.venue_label}</a></h5>
  <p class="card-text">
	<strong>Total Papers: </strong> ${d.value.count}<br/>
	<strong>First Occurence: </strong> ${timeFormatter(d.value.time_first_occurence)}<br/>
  <strong>Last Occurence: </strong> ${timeFormatter(d.value.time_last_occurence)}<br/>
  <strong>Time Span (Years): </strong> ${d.value.time_span}<br/>
  <strong>Unique years: </strong> ${d.value.unique_years}<br/>
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
<h5 class="card-header">${style_config.bottom.title}: <a href="https://www.wikidata.org/wiki/${d.author}">${d.author}</a></h5>
<div class="card-body">
  <h5 class="card-title">Title: <a href="https://www.wikidata.org/wiki/${d.id}">${d.paper_title}</a></h5>
  <p class="card-text">
	<strong>Published at:</strong> <a href="https://www.wikidata.org/wiki/${d.venue.venue_id}">${d.venue.venue_label}</a><br/>
  <strong>Published date:</strong> <a href="https://www.wikidata.org/wiki/${d.id}">${timeFormatter(d.timestamp)}</a><br/>
	<strong>Authors: </strong> ${d.all_authors}<br/>
  </p>
</div>
</div>
`;
  };

  const top_config = {
    y_fn: d => d.count,
    size_fn: d => d.unique_years,
    color_fn: d => getTopColor(d.value.title_counts),
    y_scale: d3.scaleLog().range([0, -plot_sizes.top]),
    size_scale: d3.scaleLinear().range([6, 12]),
    toolTipContent: getTopTooltipContent
  };

  const bottom_config = {
    y_fn: d => d.num_authors,
    size_fn: d => d.num_authors,
    color_fn: d => bottomColorScale(d.author),
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
  topNodeKey(d => d.author).
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
	  wiki_title_input_1 = "Q20980928";
	  wiki_title_input_2 = "";
  }
  console.log(wiki_title_input_1, wiki_title_input_2);
  d3.select("#wiki-title-input-1").property("value", wiki_title_input_1);
  d3.select("#wiki-title-input-2").property("value", wiki_title_input_2);
  console.log("Creating initial wikiplot");
  createWikiPlot(callback);
})();