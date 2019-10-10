"use strict"

import React, { PureComponent } from 'react'

import BackButton from './BackButton'

export default class Profile extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      fullName: 'Awesome Tester',
      gender: '',
      phone: [''],
      address: '',
    }
    this.onConfirm = this.onConfirm.bind(this)
    this.addPhoneBox = this.addPhoneBox.bind(this)
  }
  render() {
    const form = this.props.form
    return (
      <div>
        <header >
          <span onClick={this.props.close} className="w3-button w3-right w3-red" style={{ display: (window.self === window.top)? 'none': 'block'}}>&times;</span>
          <BackButton onClick = {this.props.back} />
        </header>
        <div >
          <div className ="w3-text-blue" >
            <h3> {form.input.email} </h3>
          </div>
          <hr />
          <div className ="w3-text-blue" >
            Please input your profile
          </div>
          <div style = {{marginBottom: '24px'}}>
            <p>
              <label>Full Name</label>
              <input  className="w3-input w3-border"
                      type="text"
                      value={this.state.fullName}
                      onChange = {this.getTyped('fullName')}
                      onKeyUp = {this.handleKeyUp('fullName')}
              />
            </p>
            <p>
              <label>Gender</label> <br />
              <span style={{marginRight: '32px'}}>
                <input  className="w3-radio" type="radio" name="gender" value="male"
                        checked = {this.state.gender === 'male'}
                        onChange = { () => this.setState({gender: 'male'}) }
                />
                <label>Male</label>
              </span>
              <span>
                <input  className="w3-radio" type="radio" name="gender" value="female"
                        checked = {this.state.gender === 'female'}
                        onChange = { () => this.setState({gender: 'female'}) }
                />
                <label>FeMale</label>
              </span>
            </p>
            <p>
              <label>Phone Number</label>
              {
                this.state.phone.map((phone, index) => {
                  return (
                    <span  key = {index} style={{display: 'block', marginBottom: '4px'}}>
                      <input  className = "w3-input w3-border"
                              type = "text"
                              value = {phone}
                              onChange = {this.getTyped('phone', index)}
                              onKeyUp = {this.handleKeyUp('phone', index)}
                      />
                      <label  className = "w3-text-blue"
                              style = {{cursor: 'pointer', display: (index === this.state.phone.length - 1) ? 'inline' : 'none'}}
                              onClick = {this.addPhoneBox} >
                        + Add more phone number
                      </label>
                    </span>
                  )
                })
              }
            </p>
            <p>
              <label>Address <span style={{fontStyle: 'italic'}}> (Optional. Need for delivery) </span> </label>
              <input    className="w3-input w3-border"
                        type="text"
                        value={this.state.address}
                        onChange = {this.getTyped('address')}
                        onKeyUp = {this.handleKeyUp('address')}
              />
            </p>
          </div>
          <div style = {{marginBottom: '42px', textAlign: 'right'}}>
            <button className = {`w3-button w3-blue ${this.state.fullName.length === 0? 'w3-disabled' : ''}`}
                    onClick = {this.onConfirm}
                    disabled = {this.state.fullName.length === 0} >
                    Continue <i className ="fa fa-chevron-right" />
            </button>
          </div>
        </div>
      </div>
    )
  }
  getTyped(target, index) {
    if (index !== undefined) {
      return (evt) => {
        const state = {}
        state[target] = [...this.state[target]];
        state[target][index] = evt.target.value;
        this.setState(state)
      }
    } else {
      return (evt) => {
        const state = {}
        state[target] = evt.target.value;
        this.setState(state)
      }
    }
  }

  handleKeyUp(target) {
    return (evt) => {
      // console.log(evt.which + '/' + evt.keyCode)
    }
  }

  addPhoneBox() {
    const phone = [...this.state.phone];
    phone.push('');
    this.setState({ phone })
  }

  onConfirm() {
    /* extract display name from fullname */
    const lastWord = /(\w+)\W*$/.exec(this._formatName(this.state.fullName))
    const displayName = lastWord && lastWord.length > 0 ? lastWord[0].trim() : 'N/A'
    /* construct profile */
    const profile = {
      email: [this.props.form.input.email],
      fullName: this._formatName(this.state.fullName) || 'N/A',
      displayName,
      gender: this.state.gender || 'N/A',
      phone: this.state.phone.filter(phone => phone.length > 0),
      address: this.state.address || 'N/A'
    }
    this.props.onConfirm('profile')(profile)
  }

  _formatName(name) {
    return this._toTitleCase(name.replace(/\s+/g, " ").trim());
  }

  _toTitleCase(phrase) {
    return phrase
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
  }
}
