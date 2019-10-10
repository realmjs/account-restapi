"use strict"

import React, { PureComponent } from 'react'

import BackButton from './BackButton'

export default class Term extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      checked : false,
      syncing: false,
      error: ''
    }
    this.onSubmit = this.onSubmit.bind(this)
    this.toggleChecked = this.toggleChecked.bind(this)
    this._renderAgreementBox = this._renderAgreementBox.bind(this)
    this._renderRegisterButton = this._renderRegisterButton.bind(this)
  }
  static getDerivedStateFromProps(props, state) {
    if (!props.active) {
      return { checked : false }
    } else {
      return null
    }
  }
  render() {
    return (
      <div>
        <header >
          <span onClick={this.props.close} className="w3-button w3-right w3-red" style={{ display: (window.self === window.top)? 'none': 'block'}}>&times;</span>
          <BackButton onClick = {this.props.back} />
        </header>
        <div className = "" >
          {this._renderAgreementBox()}
          <hr />
          {this._renderRegisterButton()}
        </div>
      </div>
    )
  }
  onSubmit() {
    this.setState({ syncing : true })
    this.props.onConfirm('term')(error => this.setState({ error, syncing: false }))
  }
  toggleChecked() {
    this.setState({ checked: !this.state.checked });
  }
  _renderAgreementBox() {
    return (
      <div className = "w3-text-grey">
        <div style = {{marginBottom: '8px'}} >
          Please read the <a className = "w3-text-blue" href = {this.props.TermsAndServicesLink} > Terms and Services </a> Agreement.
          Check the box if you accept them.
        </div>
        <div style = {{marginBottom: '16px'}} >
            <input className = "w3-check"
                   type="checkbox"
                   checked = {this.state.checked}
                   onChange = {this.toggleChecked} />
            <label> Agree <a>Terms & Services</a> </label>
        </div>
      </div>
    )
   }
  _renderRegisterButton() {
    const disabled = this.props.syncing || !this.state.checked ? 'disabled' : '';
    return (
      <div>
        <div style = {{marginBottom: '24px'}}>
          <button className = {`w3-button w3-block w3-blue w3-${disabled}`}
                  onClick = {this.onSubmit} disabled = {disabled.length > 0 ? true : false} >
            {
              this.state.syncing? 'Submitting...' : 'Submit'
            }
          </button>
        </div>
      </div>
    )
  }
}
