"use strict"

import React, { PureComponent } from 'react'

export default class RequestResetPassword extends PureComponent {
  constructor(props) {
    super(props)
  }
  render() {
    const email = __data.query.email
    return (
      <form method="post" action = "/ln/reset">
        <input type = "hidden" value = {email} name = "email" />
        <input type = "hidden" value = {__data.app} name = 'app' />
        <h3 className = "w3-text-blue"> You are requesting to reset password </h3>
        <p> An email containing link to reset your password will be sent to <span className="w3-text-blue" style={{fontWeight: 'bold'}}> {email} </span> </p>
        <p> Click the button below to confirm your request </p>
        <button type = "submit" className = "w3-button w3-blue" > Submit Request <i className = "fa fa-paper-plane" /> </button>
        {' '}
        <button type = "button" className = "w3-button" onClick={this.props.close} style={{ display:__data.app === 'account'? 'none': 'inline'}} > Cancel </button>
      </form>
    )
  }
}
