"use strict"

import React, { PureComponent } from 'react'

/* Use iframe sothat after a put request to create reset-link, the responsed html only replace iframe instead of the whole page */
export default class extends PureComponent {
  constructor(props) {
    super(props)
    this.state = { height: 0 }
    this.ref = React.createRef()
    this.resize = this.resize.bind(this)
  }
  render() {
    if (this.props.active) {
      return (
        <iframe src = {`/form?name=requestreset&app=account&email=${this.props.form.email}`}
                width = '100%'
                style = {{border: 0, height: this.state.height}}
                ref = {this.ref}
                onLoad = {this.resize}
        />
      )
    } else {
      return null
    }
  }
  resize() {
    const node = this.ref.current
    if (node) {
      const height = node.contentWindow.document.body.scrollHeight + 100
      this.setState({ height })
    }
  }
}
