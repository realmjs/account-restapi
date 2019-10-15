"use strict"

import React, { Component, PureComponent } from 'react'
import xhttp from '@realmjs/xhttp-request'

import Navigator from './CommonWidget/Navigator'
import NewPasswordBox from './CommonWidget/NexPasswordBox'

class Password extends PureComponent {
  constructor(props) {
    super(props)
  }
  render() {
    return (
      <div>
        <header>
          <h3 className = "w3-text-blue">
            <i className="fa fa-key"></i>
            <label> New Password </label>
          </h3>
        </header>
        <hr />
        <NewPasswordBox   onConfirm = { this.props.onConfirm }
                          btnLabel = 'Submit new password'
                          icon = ''
        />
        </div>
    )
  }
}

class Error extends Component {
  constructor(props) {
    super(props)
  }
  render() {
    return (
      <div>
        <header>
          <h3 className = "w3-text-red">
            <label> Error </label>
          </h3>
        </header>
        <hr />
        <div>
          <p> {this.props.error} </p>
        </div>
      </div>
    )
  }
}


class Success extends PureComponent {
  constructor(props) {
    super(props)
  }
  render() {
    return (
      <div>
        <header>
          <h3 className = "w3-text-green">
            <label> Password Updated </label>
          </h3>
        </header>
        <hr />
        <div>
          <p> Your password has been updated </p>
        </div>
      </div>
    )
  }
}


const routes = [
  { name: 'password', template: Password },
  { name: 'success', template: Success },
  { name: 'error', template: Error }
]
export default class extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      activeRoute: 'password',
      password: '',
      error: ''
    }
    this.navigate = this.navigate.bind(this)
    this.onConfirm = this.onConfirm.bind(this)
  }
  render() {
    return (
      <div style = {{maxWidth: '460px', margin: 'auto'}}>
        <Navigator  routes = {routes}
                    activeRoute = {this.state.activeRoute}
                    navigate = {this.navigate}
                    onConfirm = {this.onConfirm}
                    error = {this.state.error}
                    {...this.props}
        />
      </div>
    )
  }
  navigate(route) {
    this.setState({ activeRoute: route })
  }
  onConfirm(password) {
    xhttp.put('/users/password', { t : __data.query.t, password })
    .then( ({status, responseText}) => {
      if (status === 200) {
        this.setState({ activeRoute: 'success', error: ''})
        history.replaceState({}, 'Success', '/success')
      } else {
        this.setState({ activeRoute: 'error', error: `${status} - ${responseText}`})
        history.replaceState({}, 'Error', '/error')
      }
    })
    .catch( error => {
      this.setState({ activeRoute: 'error', error })
      history.replaceState({}, 'Error', '/error')
    })
  }
}
