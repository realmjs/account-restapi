"use strict"

import React, { PureComponent } from 'react'

import BackButton from './BackButton'

export default class Welcome extends PureComponent {
  constructor(props) {
    super(props)
  }
  render() {
    return (
      <div>
        <header >
          <span onClick={this.props.close} className="w3-button w3-right w3-red" style={{ display: (window.self === window.top)? 'none': 'block'}}>&times;</span>
        </header>
        <div className = "" >

          <div >
            <h3> Welcome {this.props.form.profile && this.props.form.profile.displayName} </h3>
          </div>

          <p className ="w3-text-blue" >
            Your new account was created
          </p>

          <p className ="w3-text-blue-grey" >
            We have send an email to your email: <span style={{fontWeight: 'bold'}}> {this.props.form.profile && this.props.form.profile.email[0]} </span> to verify your owner at the last step. 
          </p>

          <p className ="w3-text-blue-grey" >
            To enable all services. Please follow the instruction in the email to activate your account.
          </p>

          <p className ="w3-text-blue-grey">
            Thank you for signing up and using our service.
          </p>

          <div style = {{display: (window.self === window.top)? 'none': 'block', marginBottom: '72px'}}>
            <button className = {`w3-button w3-blue`}
                    onClick = {this.props.close} >
              Close
            </button>
          </div>

        </div>
      </div>
    )
  }
}
