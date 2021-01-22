"use strict"

import React, { PureComponent } from 'react'

export default class PasswordInput extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      password: '',
      error: null,
      syncing: false,
    }
    this.textInputRef = React.createRef()
    this.getTypedPassword = this.getTypedPassword.bind(this)
    this.handleKeyUpForPassword = this.handleKeyUpForPassword.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
  }
  componentDidMount() {
    this.focusTextInput()
  }
  componentDidUpdate() {
    this.focusTextInput()
  }
  focusTextInput() {
    if (this.props.active) {
      this.textInputRef.current && this.textInputRef.current.focus()
    }
  }
  render() {
    return (
      <div>
        <p>
          <label className="w3-text-grey">Password</label>
          <label className="w3-right w3-text-red"> {this.state.error || ''} </label>
          <input  className = {`w3-input w3-border ${this.state.error && this.state.error.length > 0 ? 'w3-border-red' : ''}`}
                  type = "password"
                  placeholder = "password"
                  value = {this.state.password}
                  onChange = {this.getTypedPassword}
                  onKeyUp = {this.handleKeyUpForPassword}
                  ref={this.textInputRef}
                  aria-label = "password"
          />
        </p>
        <div style = {{marginBottom: '42px'}}>
              <div className="w3-cell-row">
                <div className="w3-cell">
                <label className="w3-text-orange "><span style={{cursor: 'pointer'}} onClick = {this.props.onForgetPassword} > Forgot your password </span></label>
                </div>
                <div className="w3-cell" style={{textAlign: 'right'}}>
                  <button className = {`w3-button w3-blue`}
                        onClick = {this.onSubmit} disabled = {this.state.syncing} >
                    Submit {' '}
                    {
                      this.state.syncing ?
                        <i className ="fa fa-circle-o-notch w3-spin" style = {{marginLeft: '4px'}} />
                      :
                      <i className ="fa fa-level-down fa-rotate-90" style = {{marginLeft: '4px'}} />
                    }
                  </button>
                </div>
              </div>
            </div>
      </div>
    )
  }
  getTypedPassword(e) {
    this.setState({ password: e.target.value, error: '' })
  }

  handleKeyUpForPassword(e) {
    if (e.which == 13 || e.keyCode == 13) {
      this.onSubmit()
    }
  }
  onSubmit() {
    const password = this.state.password
    if (password.length === 0) {
      this.setState({ error: 'Password must not be empty'})
      return
    }
    this.setState({ syncing: true })
    this.props.onConfirm(password, error => this.setState({ error, syncing: false }))
  }
}
