import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import { DataSelector } from './DataLoader.js';
import { SCTGChart } from './SCTG.js';


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      datasets: [
        {
          group: "Facebook groups",
          items: [
            {name: "Social Visualization Facebook", value: "fb-group-cs-visual", filename: "datasets/fb-group-cs-visual.json"},
            {name: "Illini Drones", value: "fb-group-illini-drones"},
            {name: "Illini Skydiving", value: "fb-group-illini-skydiving"}
          ]
        },
        {
          group: "Twitter data",
          items: [
            {name: "Trump Tweets", value: "tw-trump-tweets"},
          ]
        }
      ],
      selected: 'fb-group-illini-drones'
    };
  
  this.handleDatasetChange = this.handleDatasetChange.bind(this);
  console.log(process.env.PUBLIC_URL);
  }

  handleDatasetChange(event) {
    this.setState({selected: event.target.value});
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Social Communication Temporal Graph</h1>
        </header>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>

        <div className="charts">
        <DataSelector datasets={this.state.datasets} selected={this.state.selected} handleDatasetChange={this.handleDatasetChange}/>
        <SCTGChart/>
        </div>
      </div>
    );
  }
}

export default App;
