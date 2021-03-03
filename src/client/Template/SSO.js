"use strict"

import React, { PureComponent } from 'react'

export default class extends PureComponent {
  constructor(props) {
    super(props)
  }
  componentDidMount() {
    this.props.done({ status: window.__data.status, session: window.__data.session })
  }
  render() {
    return( <div />)
  }
}
