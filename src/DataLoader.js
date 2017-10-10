import React, { Component } from 'react';

export class DataSelector extends React.Component {
  render(props) {
    (
      <label for="data-source">Select data</label>
        <select id="data-source">
          <optgroup label="Facebook groups">
            <option value="fb-group-cs-visual">Social Visualization Facebook</option>
            <option value="fb-group-illini-drones">Illini Drones </option>
            <option value="fb-group-illini-skydiving">Audi</option>
          </optgroup>
          <optgroup label="Twitter">
            <option value="tw-trump-tweets">Twitter Trump Tweets</option>
          </optgroup>
        </select>
    )
  }
}