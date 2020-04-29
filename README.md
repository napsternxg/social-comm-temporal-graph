# Social Communication Temporal Graph

These visualizations use 2 panels to plot connected data points which are temporally distributed. 
The top panel looks at aggregated data while the bottom one at the more fine grained data.

## Examples: 

* [Wikipedia Revisions](https://shubhanshu.com/social-comm-temporal-graph/wikipedia-revisions)
* [Facebook Groups](https://shubhanshu.com/FacebookGroupVisual/)
* [Tweet Sentiments](https://shubhanshu.com/SentimentSocialNets/)

## Usage

```html
<!-- The library relies on d3, d3-tip, and d3-legend, include them as follows -->
<script src='https://cdnjs.cloudflare.com/ajax/libs/d3/5.9.2/d3.min.js'></script>
<script src='https://cdnjs.cloudflare.com/ajax/libs/d3-tip/0.9.1/d3-tip.js'></script>
<script src='https://cdnjs.cloudflare.com/ajax/libs/d3-legend/2.25.6/d3-legend.min.js'></script>

<!-- For minified version include the following -->
<script src="https://cdn.jsdelivr.net/gh/napsternxg/social-comm-temporal-graph/docs/sctg.min.js"></script>
<!-- For non-minified version include the following -->
<script src="https://cdn.jsdelivr.net/gh/napsternxg/social-comm-temporal-graph/docs/sctg.js"></script>
```


## Developer

```
npm install . # installs the required packages.
npm run rollup # creates the rollup file in docs
```

## TODO

* Allow easy integration with React - https://nicolashery.com/integrating-d3js-visualizations-in-a-react-app/
* Convert into plotly dash component - https://gist.github.com/alexcjohnson/a4b714eee8afd2123ee00cb5b3278a5f
