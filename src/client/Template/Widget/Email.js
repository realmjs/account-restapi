"use strict"

import React, { PureComponent } from 'react'

import { isEmail } from '../../../lib/form'

export default class Email extends PureComponent {
  constructor(props) {
    super(props)
    this.state = { email: '', error: '', syncing: false }
    this.getTypedInput = this.getTypedInput.bind(this)
    this.handleKeyUp = this.handleKeyUp.bind(this)
    this.onConfirm = this.onConfirm.bind(this)
  }
  render() {
    return (
      <div>
        <header>
          <span onClick={this.props.close} className="w3-button w3-right w3-red" style={{ display: (window.self === window.top)? 'none': 'block'}}>&times;</span>
          <h3 className="w3-text-blue" style={{fontWeight: "bold"}} > Create New Account </h3>
        </header>
        <p className="w3-text-blue-grey">
          Please enter your email to create a new account
        </p>
        <p>
          <label> Email </label>
          <label className="w3-right w3-text-red"> {this.state.error || ''} </label>
          <input className = {`w3-input w3-border ${this.state.error && this.state.error.length > 0 ? 'w3-border-red' : ''}`}
                type = "text"
                placeholder = "email@example.com"
                value = {this.state.email}
                onChange = {this.getTypedInput}
                onKeyUp = {this.handleKeyUp}
                disabled = {this.state.syncing}
          />
        </p>
        <button type="submit" className={`w3-button w3-blue w3-right`} onClick={this.onConfirm} disabled = {this.state.syncing} >
          Next {' '}
          {
            this.state.syncing? <i className ="fa fa-circle-o-notch fa-spin" /> : <i className ="fa fa-chevron-right" />
          }
        </button>
      </div>
    )
  }
  getTypedInput(e) {
    this.setState({ email: e.target.value })
  }
  handleKeyUp(e) {
    if (e.which === 13 || e.keyCode === 13) {
      this.onConfirm()
    }
  }
  onConfirm() {
    const email = this.state.email
    if (email.length === 0) {
      const error = "Email is empty"
      this.setState({ error })
      return
    }
    if (!isEmail(email)) {
      const error = "Invalid email"
      this.setState({ error })
      return
    }
    this.setState({ syncing: true })
    this.props.onConfirm('email')(email, error => this.setState({ error, syncing: false }))
  }
}
