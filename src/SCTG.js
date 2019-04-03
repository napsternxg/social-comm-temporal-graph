import React, { Component } from 'react';
import * as d3 from 'd3';



/**
	Main components:
	- Main chart: Show timelines and nodes
	- Data loader: Load data from various sources and pass it to Main chart.
	- Chart Controls: select key node, show dates
**/


export class SCTGChart extends Component {
	constructor(props) {
		super(props);
		this.makeChart = this.makeChart.bind(this);
	}
	componentDidMount() {
		//this.makeChart();
	}

	compnentDidUpdate() {
		//this.makeChart();
	}
	
	makeChart() {
		const node = this.node;
		console.log(node);
		console.log("Making chart");
		d3.select(node).select("#d3-charts")
			.selectAll("p")
			.data([0,1,2,3])
			.enter()
			.append("p")
			.text((d) => {return +d;});
	}

	render (props) {
		return (
			<div className="chart-area" ref={node => this.node = node}>
			<div id="d3-charts"></div>
			<p>Chart will go here</p>
			</div>
			);
	}
}