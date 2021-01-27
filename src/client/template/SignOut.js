"use strict"

import React, { PureComponent } from 'react'

import xhttp from '@realmjs/xhttp-request'

export default class extends PureComponent {
  constructor(props) {
    super(props)
  }
  componentDidMount() {
    const app = this.props.data && this.props.data.app || undefined;
    const sid = this.props.data && this.props.data.query && this.props.data.query.sid || undefined;
    xhttp.delete('/session', { app, sid }, {authen: true})
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
