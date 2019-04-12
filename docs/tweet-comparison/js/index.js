function activate(){
  new Juniper({
    repo: 'napsternxg/SocialMediaDownloader',
    useStorage: true
  });

    // listen to status updates
    document.addEventListener('juniper', ev =>
                              console.log('Status:', ev.detail.status))
}

function parseOutput(){
  const outputNode = document.querySelector('div.juniper-cell > div.juniper-output > div > div > div.p-Widget.jp-RenderedText.jp-mod-trusted.jp-OutputArea-output > pre');
  const message = `localStorage "sctg_data" updated with new tweets data of ${outputNode.textContent.length} chars.`;
  console.log(message);
  localStorage.setItem("sctg_data", outputNode.textContent);
  d3.select("#dataStatus").html(message);
}

function getData(){
  var data = JSON.parse(localStorage.getItem("sctg_data"));
  const dataStatusNode = d3.select("#dataStatus");
  const search_query = JSON.parse(localStorage.getItem("sctg_query"));
  var status = "No data in localStorage."
  if(data){
    data = Object.entries(data);
    console.log(data);
    status = `Found ${data.map(d=> d[1].length+" tweets for "+d[0]).join(", ")}`;
  } 
  dataStatusNode.html(status);
  return data;
}

function parseAndPlot(){
  parseOutput();
  createWikiPlot();
}

function getCredentials(){
  const credentials = {
    consumer_key: d3.select("#consumer_key").property("value"),
    consumer_secret: d3.select("#consumer_secret").property("value"),
    access_token_key: d3.select("#access_token_key").property("value"),
    access_token_secret: d3.select("#access_token_secret").property("value"),
  }
  
  if(
    credentials.consumer_key 
    && credentials.consumer_secret
    && credentials.access_token_key
    && credentials.access_token_secret
  ){
    console.log("Saving in local storage");
    localStorage.setItem("twitter_credentials", JSON.stringify(credentials));
  }  
  return credentials;
}

function updateCode(){
  const credentials = getCredentials();
  const search_query = [1,2].map(i=> d3.select(`#search_query_${i}`).property("value") ).filter(x => x);
  localStorage.setItem("sctg_query", JSON.stringify(search_query));
  const code_block = document.querySelector("pre");
  code_block.textContent = `
from twarc import Twarc
import json
credentials = \{
  "consumer_key": "${credentials.consumer_key}",
  "consumer_secret": "${credentials.consumer_secret}",
  "access_token": "${credentials.access_token_key}",
  "access_token_secret": "${credentials.access_token_secret}"
\}
def parseTweet(d):
  t = {}
  t["id"] = d["id_str"]
  t["retweet_count"] = d["retweet_count"]
  t["favorite_count"] = d["favorite_count"]
  t["created_at"] = d["created_at"]
  t["full_text"] = d["full_text"]
  t["user"] = d["user"]["screen_name"]
  t["followers_count"] = d["user"]["followers_count"]
  return t

twarc_obj = Twarc(**credentials)
data = {}
for q in [${search_query.map(d => "\'"+d+"\'")}]:
  data[q] = []
  for d in twarc_obj.search(q, max_pages=5):
    data[q].append(parseTweet(d))
print(json.dumps(data))
with open("tweets.json", "w+") as fp:
  json.dump(data, fp, indent=2)
  `;
  activate();
  d3.select("#parsePlot").property("disabled", false);
  d3.select("#saveAndGen").property("disabled", true);
}

const twitterDateParser = d3.utcParse("%a %b %d %H:%M:%S %Z %Y");

function oldParser(d){
  return {
      id: d["id_str"],
      user: d["user"]["screen_name"],
      followers_count: d["user"]["followers_count"],
      friends_count: d["user"]["friends_count"],
      retweet_count: d["retweet_count"],
      favorite_count: d["favorite_count"],
      created_at: twitterDateParser(d["created_at"]),
      full_text: d["full_text"],
      title: key
    }
}

function getParsedData(data_entry) {
  const key = data_entry[0];
  const tweets_json = data_entry[1];
  const tweets = tweets_json.map(d => {
    return {
      id: d["id"],
      user: d["user"],
      followers_count: +d["followers_count"],
      friends_count: +d["friends_count"],
      retweet_count: +d["retweet_count"],
      favorite_count: +d["favorite_count"],
      created_at: twitterDateParser(d["created_at"]),
      full_text: d["full_text"],
      title: key
    };
  });
  return tweets;
}

function getSearchQueries(){
  const search_query = localStorage.getItem("sctg_query");
	const search_queries = JSON.parse(search_query).filter(x => x);
	console.log(search_queries);
	var url = new URL(window.location.href);
	var search_params = new URLSearchParams();
	for(var i=0; i<search_queries.length; i++){
		search_params.set(`search_query_${i+1}`, search_queries[i]);
	}
	url.search = search_params.toString();
	history.replaceState(null, "", url.search.toString());
	return search_queries;
}

function createWikiPlot(callback) {
  /**
   * To fetch data from wikipedia API, we need to add origin=* to the get parameter request
   **/
  if (callback) callback();
  const search_queries = getSearchQueries();
  const data = getData();
  d3.select("#page-title").text(search_queries.join(" and "));
  if(data){
    const tweets = [].concat.apply([], data.map(getParsedData));;
    createPlot(tweets, search_queries);
  }
}

function createPlot(tweets, search_queries) {
  const parsed_data = tweets;
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
      followers_count: items[0].followers_count,
      time_first_occurence: d3.min(items, v => v.created_at),
      total_retweets: d3.sum(items, v => v.retweet_count),
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
      y_axis_label: "Total Retweets",
      size_label: "Tweet count"
    },
    bottom: {
      title: "Tweets",
      y_axis_label: "Retweets",
      size_label: "Favorites"
    }
  };

  function getTopColorScale(search_queries){
	  var range = [
		d3.color("Crimson").darker(), 
		d3.color("DarkOliveGreen").darker()
	  ]
	  const domain = search_queries.length == 1 ? search_queries : [].concat(["Both"], search_queries);
	  range = search_queries.length == 1 ? range : [].concat([d3.color("DodgerBlue").darker()], range);
	  console.log(domain, range);
	  return d3.scaleOrdinal()
				.domain(domain)
				.range(range);
	  
  }
  
  var topColorScale = getTopColorScale(search_queries);

  var getTopColor = title_counts => {
    var x = title_counts.length > 1 ? "Both" : title_counts[0].key;
    return topColorScale(x);
  };

  var bottomColorScale = d3.scaleOrdinal()
    .domain(search_queries)
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
  <h5 class="card-title">User: <a href="https://twitter.com/${d.key}">${d.key}</a></h5>
  <p class="card-text">
	<strong>Total tweets: </strong> ${d.value.count}<br/>
	<strong>Total retweets: </strong> ${d.value.total_retweets}<br/>
  <strong>Followers: </strong> ${d.value.followers_count}<br/>
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
  <h5 class="card-title">User: <a href="https://twitter.com/${d.user}">${d.user}</a></h5>
  <p class="card-text">
	<strong>Retweet count: </strong> ${d.retweet_count}<br/>
  <strong>Favorite count: </strong> ${d.favorite_count}<br/>
	<strong>Created at: </strong> <a href="https://twitter.com/${d.user}/status/${d.id}"">${d.created_at}</a><br/>
	<strong>Full text: </strong> ${d.full_text}<br/>
  </p>
</div>
</div>
`;
  };

  const top_config = {
    y_fn: d => d.total_retweets,
    size_fn: d => d.count,
    color_fn: d => getTopColor(d.value.title_counts),
    y_scale: d3.scaleLinear().range([0, -plot_sizes.top]),
    size_scale: d3.scaleLinear().range([2, 12]),
    toolTipContent: getTopTooltipContent
  };

  const bottom_config = {
    y_fn: d => d.retweet_count,
    size_fn: d => d.favorite_count,
    color_fn: d => bottomColorScale(d.title),
    y_scale: d3.
    scaleLinear().
    range([plot_sizes.bottom + plot_sizes.offset, plot_sizes.offset]),
    size_scale: d3.scaleLinear().range([2, 10]),
    toolTipContent: getBottomTooltipContent
  };

  const config = {
    top: top_config,
    bottom: bottom_config
  };

  sctg_layout = sctg.computeLayout().
  topNodeKey(d => d.user).
  topTimeKey(d => d.time_first_occurence).
  bottomTimeKey(d => d.created_at).
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
    const credentials = JSON.parse(localStorage.getItem("twitter_credentials"));
    if(credentials){
      d3.select("#consumer_key").property("value", credentials.consumer_key);
      d3.select("#consumer_secret").property("value", credentials.consumer_secret);
      d3.select("#access_token_key").property("value", credentials.access_token_key);
      d3.select("#access_token_secret").property("value", credentials.access_token_secret);
    }
  const current_url = new URL(window.location.href);
  const params = current_url.searchParams;
  console.log(params.get("search_query_1"), params.get("search_query_2"));
  var search_query_1 = params.get("search_query_1");
  var search_query_2 = params.get("search_query_2");
  if(!search_query_1 && !search_query_2){
	  search_query_1 = "Narendra Modi";
	  search_query_2 = "Rahul Gandhi";
  }
  console.log(search_query_1, search_query_2);
  d3.select("#search_query_1").property("value", search_query_1);
  d3.select("#search_query_2").property("value", search_query_2);
  console.log("Creating initial wikiplot");
  createWikiPlot();
})();