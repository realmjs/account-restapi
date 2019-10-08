"use strict"

import React, { Component } from 'react'

import { postMessage } from '../../lib/message'

import Error from './Error'
import SignUp from './SignUp'

const routes = {
  error: Error,
  signup: SignUp
}

export default class App extends Component {
  constructor(props) {
    super(props)

  }
  render() {
    const Page = routes[this.props.data.route]
    return (
      React.createElement(Page, {...this.props})
    )
  }
}
