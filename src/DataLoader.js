import React, { Component } from 'react';


function Optgroup (props) {
  const items = props.items.map((item) => {
    return (
      <option value={item.value}>{item.name}</option>
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
        <Optgroup items={dataset.items} group={dataset.group}/>
        );
    });
    return (
      <div className="data-selector">
      <label for="data-source">Select data:{' '} </label>
        <select id="data-source" value={this.props.selected} onChange={this.handleDatasetChange}>
          {optgroups}
        </select>
      <p>Selected <strong>{this.props.selected}</strong></p>
      </div>
    );
  }
}