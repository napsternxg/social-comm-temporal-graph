import React, { Component } from 'react';


function Optgroup (props) {
  const items = props.items.map((item) => {
    return (
      <option key={item.value} value={item.value} data-url={item.url}>{item.name}</option>
      );
  });
  return (
    <optgroup label={props.group}>
      {items}
    </optgroup>
    );
}


export class DataSelector extends Component {
  constructor(props) {
    super(props);
    this.handleDatasetChange = props.handleDatasetChange;
  }
  render() {
    const optgroups = this.props.datasets.map((dataset) => {
      return (
        <Optgroup key={dataset.group} items={dataset.items} group={dataset.group}/>
        );
    });
    return (
      <div className="data-selector">
      <label htmlFor="data-source">Select data:{' '} </label>
        <select id="data-source" value={this.props.selected} onChange={this.handleDatasetChange}>
          {optgroups}
        </select>
      <p>Selected <strong>{this.props.selected}</strong></p>
      {typeof this.props.selectedItem.url === "undefined" ? ""
      : <p>See its demo at: <a href={this.props.selectedItem.url} target="_blank">{this.props.selectedItem.name}</a></p>}
      
      </div>
    );
  }
}