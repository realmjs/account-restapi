"use strict"

import React, { Component } from 'react'

import xhttp from '@realmjs/xhttp-request'

import Navigator from './Widget/Navigator'
import Email from './Widget/Email'
import Password from './Widget/Password'
import Profile from './Widget/Profile'
import Term from './Widget/Term'
import Welcome from './Widget/Welcome'

import { isEmail } from '../../lib/form'

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
        input: { email: '' },
        error: { email: '' },
        syncing: { email: false },
      }
    }
    this.flow = ['email', 'password', 'profile', 'term', 'welcome']
    const methods = ['navigate', 'next', 'back', 'getTypedInput', 'handleKeyUp', 'onConfirm']
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
                    getTypedInput = {this.getTypedInput}
                    handleKeyUp = {this.handleKeyUp}
                    onConfirm= {this.onConfirm}
                    form = {this.state.form}

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
  getTypedInput(name) {
    return e => {
      const form = {...this.state.form}
      form.input[name] = e.target.value
      form.error[name] = ''
      this.setState({ form })
    }
  }
  handleKeyUp(name) {
    return e => {
      if (e.which === 13 || e.keyCode === 13) {
        return this.onConfirm(name)()
      }
    }
  }
  onConfirm(route) {
    return e => {
      const form = {...this.state.form}
      const email = form.input.email
      if (email.length === 0) {
        form.error.email = "Email is empty"
        this.setState({ form })
        return
      }
      if (!isEmail(email)) {
        form.error.email = "Invalid email"
        this.setState({ form })
        return
      }
      form.syncing.email = true
      this.setState({ form })
      xhttp.get(`/users?u=${email}`)
      .then( status => {
        if (status === 200) {
          form.error.email = "This email has been used"
          form.syncing.email = false
        } else if (status === 404) {
          form.error.email = ""
          form.syncing.email = false
          this.next()
        } else {
          // unexpected error from server --> show a toast here
        }
        this.setState({ form })
      })
      .catch( err => {
        // timeout error --> show a toast here
        form.syncing.email = false
        this.setState({ form })
      })
    }
  }
}
