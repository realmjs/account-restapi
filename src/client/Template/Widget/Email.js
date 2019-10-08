"use strict"

import React, { PureComponent } from 'react'

export default class Email extends PureComponent {
  constructor(props) {
    super(props)
    this.state = { error: '' }
  }
  render() {
    const form = this.props.form
    const email = form.input.email
    const error = form.error.email
    const syncing= form.syncing.email
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
          <label className="w3-right w3-text-red"> {error} </label>
          <input className = {`w3-input w3-border ${error.length === 0 ? '' : 'w3-border-red'}`}
                type = "text"
                placeholder = "email@examaple.com"
                value = {email}
                onChange = {this.props.getTypedInput('email')}
                onKeyUp = {this.props.handleKeyUp('email')}
                disabled = {syncing}
          />
        </p>
        <button type="submit" className={`w3-button w3-blue w3-right`} onClick={this.props.onConfirm('email')} disabled = {syncing} >
          Next {' '}
          {
            this.state.syncing? <i className ="fa fa-circle-o-notch fa-spin" /> : <i className ="fa fa-chevron-right" />
          }
        </button>
      </div>
    )
  }
}
