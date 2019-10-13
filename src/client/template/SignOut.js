"use strict"

import React, { PureComponent } from 'react'

import xhttp from '@realmjs/xhttp-request'

export default class extends PureComponent {
  constructor(props) {
    super(props)
  }
  componentDidMount() {
    xhttp.delete('/session', { app: __data.app }, {authen: true})
    .then( ({status}) => {
      this.props.done({ status })
    })
    .catch( err => {
      this.props.done(`Error: Network timeout`)
    })
  }
  render() {
    return( <div />)
  }
}
