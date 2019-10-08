"use strict"

import React, { PureComponent } from 'react'

import BackButton from './BackButton'

export default class Password extends PureComponent {
  constructor(props) {
    super(props)
  }
  render() {
    return (
      <div>
        <header >
          <span onClick={this.props.close} className="w3-button w3-right w3-red" style={{ display: (window.self === window.top)? 'none': 'block' }}>&times;</span>
          <BackButton onClick = {this.props.back} />
        </header>
        <button className="w3-button w3-blue" onClick = {e=>this.props.navigate('profile')}> Next </button>
      </div>
    )
  }
}
