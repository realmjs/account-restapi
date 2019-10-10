"use strict"

import React, { PureComponent } from 'react'

import BackButton from './BackButton'

import NewPasswordBox from './NexPasswordBox'

export default class Password extends PureComponent {
  constructor(props) {
    super(props)
  }
  render() {
    const form = this.props.form
    return (
      <div>
        <header >
          <span onClick={this.props.close} className="w3-button w3-right w3-red" style={{ display: (window.self === window.top)? 'none': 'block' }}>&times;</span>
          <BackButton onClick = {this.props.back} />
        </header>
        <div >
          <div className ="w3-text-blue" >
            <h3> {form.input.email} </h3>
          </div>
          <hr />
          <NewPasswordBox onConfirm = { (password, done) => { this.props.onConfirm('password')(password); done(null) } }
                          btnLabel = 'Continue'
                          icon = 'fa fa-chevron-right'
          />
        </div>
      </div>
    )
  }
}
