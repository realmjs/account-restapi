"use strict"

import React, { Component } from 'react'

export default class Error extends Component {
  constructor(props) {
    super(props)
  }
  componentDidMount() {
    const error = this.props.data.error
    this.props.done({ status: error.code })
  }
  render() {
    const error = this.props.data.error
    return (
      <div className="w3-container" style={{ padding: "10px 12px", maxWidth: "460px" }}>
        <header>
          <span onClick={this.props.close} className="w3-button w3-right w3-red"> &times; </span>
        </header>
        <div>
          <h4 className="w3-text-red"> {error.code} </h4>
          <p> {error.detail} </p>
        </div>
      </div>
    )
  }
}
