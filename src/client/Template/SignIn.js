"use strict"

import React, { Component, PureComponent } from 'react'

import xhttp from '@realmjs/xhttp-request'

import Navigator from './CommonWidget/Navigator'
import BackButton from './CommonWidget/BackButton'

import { isEmail } from '../../lib/form'

/* Widgets used in Sign-in page */

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
          <h3 className="w3-text-blue" style={{fontWeight: "bold"}} > Login </h3>
        </header>
        <p className="w3-text-blue-grey">
          Please enter your email
        </p>
        <p>
          <label className="w3-text-grey"> Email </label>
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
        <div style = {{marginBottom: '42px'}}>
          <div className="w3-cell-row">
            <div className="w3-cell">
              <label className="w3-text-red w3-large"><a href={`/form?name=signup&app=${__data.app}`}> Create New Account </a></label>
            </div>
            <div className="w3-cell" style={{textAlign: 'right'}}>
              <button type="submit" className={`w3-button w3-blue `} onClick={this.onConfirm} disabled = {this.state.syncing} >
                Next {' '}
                {
                  this.state.syncing? <i className ="fa fa-circle-o-notch fa-spin" /> : <i className ="fa fa-chevron-right" />
                }
              </button>
            </div>
          </div>
        </div>
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
    this.state = {
      password: '',
      error: null,
      syncing: false
    }
    this.getTypedPassword = this.getTypedPassword.bind(this)
    this.handleKeyUpForPassword = this.handleKeyUpForPassword.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
  }
  render() {
    const form = this.props.form
    return (
      <div>
          <header >
            <span onClick={this.props.close} className="w3-button w3-right w3-red" style={{ display: (window.self === window.top)? 'none': 'block'}}>&times;</span>
            <BackButton onClick = {this.props.back} />
          </header>
          <div>
            <div className ="w3-text-blue" >
              <h3> {form.email} </h3>
            </div>
            <p>
              <label className="w3-text-grey">Password</label>
              <label className="w3-right w3-text-red"> {this.state.error || ''} </label>
              <input  className = {`w3-input w3-border ${this.state.error && this.state.error.length > 0 ? 'w3-border-red' : ''}`}
                      type = "password"
                      placeholder = "password"
                      value = {this.state.password}
                      onChange = {this.getTypedPassword}
                      onKeyUp = {this.handleKeyUpForPassword}
              />
            </p>
            <div style = {{marginBottom: '42px'}}>
              <div className="w3-cell-row">
                <div className="w3-cell">
                <label className="w3-text-orange "><a href={`/form?name=requestresetpassword&app=${__data.app}&email=${form.email}`}> Forgot your password </a></label>
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
    this.props.onConfirm('password')(password, error => this.setState({ error, syncing: false }))
  }
}

class Welcome extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {}
  }
  static getDerivedStateFromProps(props, state) {
    if (props.active) {
      setTimeout( _ => props.close(), 1500)
      return null
    } else {
      return null
    }
  }
  render() {
    const user = this.props.user
    return (
      <div style = {{textAlign: 'center'}} >
        <div >
          <h3> Welcome {user && user.profile && user.profile.displayName} </h3>
        </div>
        <p>
          You have signed in.
        </p>
      </div>
    )
  }
}

/* Sign-In Page */

const routes = [
  { name: 'email', template: Email },
  { name: 'password', template: Password },
  { name: 'welcome', template: Welcome, animate: 'w3-animate-top' },
]

export default class SignIn extends Component {
  constructor(props) {
    super(props)
    this.state = {
      activeRoute: 'email',
      form: { email: '', password: '' },
      user: null
    }
    this.flow = ['email', 'password', 'welcome']
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
                    onConfirm = {this.onConfirm}
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
    if (email === this.state.form.email) {
      done && done()
      this.next()
    }
    xhttp.get(`/users?u=${email}`, { timeout: 30000 })
    .then( ({status}) => {
      if (status === 200) {
        done && done()
        const form = {...this.state.form}
        form.email = email
        this.setState({ form })
        this.next()
      } else if (status === 404) {
        done && done(`Not registered`)
      } else {
        done && done(`Error: ${status}`)
        console.error(`Error returned by server: ${status}`)
      }
    })
    .catch( err => {
      done && done(`Error: Network timeout`)
    })
  }
  onConfirmPassword(password, done) {
    const form = {...this.state.form}
    xhttp.post(`/session`, { username: form.email, password }, { timeout: 30000 })
    .then( ({status, responseText}) => {
      if (status === 200) {
        done && done()
        const session = JSON.parse(responseText)
        this.setState({ user: session.user})
        this.props.done && this.props.done({status: 200, session})
        this.next()
      } else {
        done && done(`Error: Failed to signing in`)
      }
    })
    .catch( err => {
      done && done(`Error: Network timeout`)
    })
  }
}
