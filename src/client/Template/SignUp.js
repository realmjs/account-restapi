"use strict"

import React, { Component } from 'react'

import xhttp from '@realmjs/xhttp-request'

import Navigator from './Widget/Navigator'
import Email from './Widget/Email'
import Password from './Widget/Password'
import Profile from './Widget/Profile'
import Term from './Widget/Term'
import Welcome from './Widget/Welcome'

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
    xhttp.get(`/users?u=${email}`, { timeout: 5000 })
    .then( status => {
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
    xhttp.post(`/users`, { user })
    .then( status => {
      if (status === 200) {
        done && done()
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
