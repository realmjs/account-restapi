
"use strict"

import React, { Component } from 'react'

export default class Toast extends Component {
  constructor(props) {
    super(props)
    this.state = { opening: false, closing: false, display: false }
    this._animateClosing = this._animateClosing.bind(this)
  }
  static getDerivedStateFromProps(props, state) {
    if (props.display && !state.display) {
      return {  opening: true, display: true }
    } else {
      return { display: props.display }
    }
  }
  componentDidUpdate() {
    if (this.props.display) {
      this._waitFor2second().then(this._animateClosing).then(this.props.close)
    }
  }
  render() {
    const display = this.props.display ? 'block' : 'none'
    let   anim = ''
    const style = {
      display,
      position: 'fixed',
      left: 0,
      width: '100%',
      zIndex: 1,
      margin: 0,
    }
    if (this.props.bottom) {
      style.bottom = 0
    } else {
      style.top = 0
    }
    if (this.state.opening || this.state.closing) {
      anim = this.props.bottom? 'w3-animate-bottom' : 'w3-animate-top'
    }
    if (this.state.closing) {
      style.animationDirection = 'reverse'
    }
    return (
      <div className={`w3-panel w3-border w3-${this.props.toast && this.props.toast.color} ${anim}`} style={style}>
        <h3> <i className={this.props.toast && this.props.toast.icon} /> {this.props.toast && this.props.toast.title} </h3>
        <p> {this.props.toast && this.props.toast.message} </p>
      </div>
    )
  }
  _waitFor2second() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, 1500)
    })
  }
  _animateClosing() {
    this.setState({ opening: false, closing: true })
    return new Promise((resolve) => {
      setTimeout(() => {
        this.setState({ closing: false })
        resolve()
      }, 200)
    })
  }

}
