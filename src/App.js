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
            {name: "Social Visualization Facebook", value: "fb-group-cs-visual", url: "http://shubhanshu.com/FacebookGroupVisual"},
            {name: "Illini Drones", value: "fb-group-illini-drones"},
            {name: "Illini Skydiving", value: "fb-group-illini-skydiving"}
          ]
        },
        {
          group: "Twitter data",
          items: [
            {name: "Tweets", value: "tw-trump-tweets", url: "http://shubhanshu.com/SentimentSocialNets/"},
          ]
        }
      ],
      selected: 'fb-group-illini-drones',
    };  
  this.handleDatasetChange = this.handleDatasetChange.bind(this);
  this.getSelectedItem = this.getSelectedItem.bind(this);
  console.log(process.env.PUBLIC_URL);
  }

  componentWillMount() {
      this.setState({selectedItem: this.getSelectedItem(this.state.selected)});
  }

  getSelectedItem(value) {
    const selectedItem = this.state.datasets.reduce((acc, dataset) => {
      return acc.concat(dataset.items);
    }, []).filter((item) => {
      return item.value === value;
    });
    return selectedItem[0];
  }

  handleDatasetChange(event) {
    const selectedItem = this.getSelectedItem(event.target.value);
    this.setState({selected: event.target.value, selectedItem: selectedItem});
    console.log(selectedItem);
  }

  render() {
    console.log(this.state);
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
        <DataSelector
         datasets={this.state.datasets}
         selected={this.state.selected} 
         selectedItem={this.state.selectedItem}
         handleDatasetChange={this.handleDatasetChange}/>
        <SCTGChart/>
        </div>
      </div>
    );
  }
}

export default App;
