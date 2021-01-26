"use strict"

import React, { Component, PureComponent } from 'react'

import xhttp from '@realmjs/xhttp-request'

import Navigator from './CommonWidget/Navigator'
import BackButton from './CommonWidget/BackButton'
import PasswordInput from './CommonWidget/PasswordInput'
import RequestResetPasswordIframe from './CommonWidget/RequestResetPasswordIframe'

import { isEmail } from '../../lib/form'

/* Widgets used in Sign-in page */

class Email extends PureComponent {
  constructor(props) {
    super(props)
    this.state = { email: '', error: '', syncing: false }
    this.getTypedInput = this.getTypedInput.bind(this)
    this.handleKeyUp = this.handleKeyUp.bind(this)
    this.onConfirm = this.onConfirm.bind(this)
    this.textInputRef = React.createRef()
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
                type = "email"
                placeholder = "email@example.com"
                value = {this.state.email}
                onChange = {this.getTypedInput}
                onKeyUp = {this.handleKeyUp}
                disabled = {this.state.syncing}
                ref={this.textInputRef}
                aria-label = "email"
          />
        </p>
        <div style = {{marginBottom: '42px'}}>
          <div className="w3-cell-row">
            <div className="w3-cell">
              <label className="w3-text-red w3-large"><a href={`/form?name=signup&app=${this.props.data.app}`}> Create New Account </a></label>
            </div>
            <div className="w3-cell" style={{textAlign: 'right'}}>
              <button type="submit" className={`w3-button w3-blue `} onClick={this.onConfirm} disabled = {this.state.syncing} >
                Next {' '}
                {
                  this.state.syncing? <i className ="fas fa-circle-notch fa-spin" /> : <i className ="fa fa-chevron-right" />
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
    const email = this.state.email.toLowerCase()
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
      display: 'password',
    }
  }
  render() {
    const form = this.props.form
    return (
      <div>
          <header >
            <span onClick={this.props.close} className="w3-button w3-right w3-red" style={{ display: (window.self === window.top)? 'none': 'block'}}>&times;</span>
            <BackButton onClick = {this.props.back} />
          </header>
          <div style={{ display: this.display('password') }} >
            <div className ="w3-text-blue" >
              <h3> {form.email} </h3>
            </div>
            <PasswordInput  active = {this.state.display === 'password'}
                            onConfirm = {this.props.onConfirm('password')}
                            onForgetPassword = {e => this.setState({ display: 'forget-password'})}
            />
          </div>
          <div style={{ display: this.display('forget-password') }} >
            <RequestResetPasswordIframe active = {this.state.display === 'forget-password'}
                                        form = {form}
            />
          </div>
        </div>

    )
  }
  display(state) {
    return this.state.display === state ? 'block' : 'none'
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
    /* blacklist email that checked. It is to reduce number of serve hit */
    this.blacklist = []
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
      return
    }
    if (this.blacklist.indexOf(email) !== -1) {
      done && done("Not registered")
      return
    }
    const app = this.props.data ? this.props.data.app : undefined;
    xhttp.get(`/user?u=${email}&app=${app}`, { timeout: 30000 })
    .then( ({status}) => {
      if (status === 200) {
        done && done()
        const form = {...this.state.form}
        form.email = email
        this.setState({ form })
        this.next()
      } else if (status === 404) {
        this.blacklist.push(email)
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
    xhttp.post(`/session`, { username: form.email, password, app: this.props.data ? this.props.data.app : undefined }, { timeout: 30000 })
    .then( ({status, responseText}) => {
      if (status === 200) {
        done && done()
        const session = JSON.parse(responseText).session
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
