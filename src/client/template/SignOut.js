"use strict"

import React, { PureComponent } from 'react'

import xhttp from '@realmjs/xhttp-request'

export default class extends PureComponent {
  constructor(props) {
    super(props)
  }
  componentDidMount() {
    xhttp.delete('/session', { app: this.props.data ? this.props.data.app : undefined }, {authen: true})
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
