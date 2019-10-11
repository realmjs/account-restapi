"use strict"

import React, { Component, PureComponent } from 'react'

import xhttp from '@realmjs/xhttp-request'

import Navigator from './CommonWidget/Navigator'

import BackButton from './CommonWidget/BackButton'
import NewPasswordBox from './CommonWidget/NexPasswordBox'

import { isEmail } from '../../lib/form'

/* Widgets for page */

class Email extends PureComponent {
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
    this.setState({ email: e.target.value, error: '' })
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

class Password extends PureComponent {
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
        <div>
          <div className ="w3-text-blue w3-border-bottom" >
            <h3> {form.email} </h3>
          </div>
          <div style={{ marginTop: '12px' }}>
            <NewPasswordBox onConfirm = { (password, done) => { this.props.onConfirm('password')(password); done(null) } }
                            btnLabel = 'Continue'
                            icon = 'fa fa-chevron-right'
            />
          </div>          
        </div>
      </div>
    )
  }
}

class Profile extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      fullName: '',
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
          <div className ="w3-text-blue w3-border-bottom" >
            <h3> {form.email} </h3>
          </div>
          <div className ="w3-text-blue" style={{ marginTop: '12px' }}>
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
      email: [this.props.form.email],
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

class Term extends PureComponent {
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

class Welcome extends PureComponent {
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


/* Sign Up page */

const routes = [
  { name: 'email', template: Email },
  { name: 'password', template: Password },
  { name: 'profile', template: Profile },
  { name: 'term', template: Term },
  { name: 'welcome', template: Welcome, animate: 'w3-animate-top' },
]

export default class SignUp extends Component {
  constructor(props) {
    super(props)
    this.state = {
      activeRoute: 'email',
      form: {
        email: '',
        password: '',
        profile: null,
      }
    }
    this.flow = ['email', 'password', 'profile', 'term', 'welcome']
    const methods = ['navigate', 'next', 'back', 'onConfirm']
    methods.forEach( method => this[method] = this[method].bind(this) )
  }
  render() {
    return (
      <div className="w3-container" style={{ padding: "10px 12px", maxWidth: "460px" }}>
        <Navigator  routes = {routes}
                    activeRoute = {this.state.activeRoute}
                    navigate = {this.navigate}
                    next = {this.next}
                    back = {this.back}
                    onConfirm= {this.onConfirm}
                    form = {this.state.form}
                    {...this.props}

        />
      </div>
    )
  }
  navigate(route) {
    this.setState({ activeRoute: route })
    return this
  }
  next() {
    const current = this.flow.findIndex( route => route === this.state.activeRoute )
    if (current < this.flow.length- 1) {
      this.setState({ activeRoute: this.flow[current + 1] })
    }
    return this
  }
  back() {
    const current = this.flow.findIndex( route => route === this.state.activeRoute )
    if (current > 0) {
      this.setState({ activeRoute: this.flow[current - 1] })
    }
    return this
  }
  onConfirm(route) {
    return this[`onConfirm${route.replace(/^\w/, c => c.toUpperCase())}`].bind(this)
  }
  onConfirmEmail(email, done) {
    xhttp.get(`/users?u=${email}`, { timeout: 30000 })
    .then( ({status}) => {
      if (status === 200) {
        done && done("This email has been used")
      } else if (status === 404) {
        done && done()
        const form = {...this.state.form}
        form.email = email
        this.setState({ form })
        this.next()
      } else {
        done && done(`Error: ${status}`)
        console.error(`Error returned by server: ${status}`)
      }
    })
    .catch( err => {
      done && done(`Error: Network timeout`)
    })
  }
  onConfirmPassword(password) {
    const form = {...this.state.form}
    form.password = password
    this.setState({ form })
    this.next()
  }
  onConfirmProfile(profile) {
    const form = {...this.state.form}
    form.profile = profile
    this.setState({ form })
    this.next()
  }
  onConfirmTerm(done) {
    console.log('Term is accepted')
    const user = {...this.state.form}
    xhttp.post(`/users`, { user }, { timeout: 30000 })
    .then( ({status, responseText}) => {
      if (status === 200) {
        done && done()
        const session = JSON.parse(responseText)
        this.props.xdone && this.props.xdone(session)
        this.next()
      } else {
        done && done(`Error: ${status}`)
        console.error(`POST /users --> Error returned by server: ${status}`)
      }
    })
    .catch( err => {
      done && done(`Error: Network timeout`)
    })    
  }
}
