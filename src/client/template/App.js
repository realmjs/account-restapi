"use strict"

import React, { Component } from 'react'

import { postMessage } from '../../lib/message'

import Error from './Error'

export default class App extends Component {
  constructor(props) {
    super(props)

  }
  render() {
    return (
     <Error {...this.props} />
    )
  }
}
