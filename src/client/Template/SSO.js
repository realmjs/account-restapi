"use strict"

import React, { PureComponent } from 'react'

export default class extends PureComponent {
  constructor(props) {
    super(props)
  }
  componentDidMount() {
    this.props.done({ status: 200, session: window__data.session })
  }
  render() {
    return( <div />)
  }
}
