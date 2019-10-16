"use strict"

import React, { Component } from 'react'

import { postMessage } from '../../lib/message'

import Error from './Error'
import SignUp from './SignUp'
import SignIn from './SignIn'
import SignOut from './SignOut'
import SSO from './SSO'
import NewPasswordForm from './NewPasswordForm'
import MyAccount from './MyAccount'

const routes = {
  error: Error,
  signup: SignUp,
  signin: SignIn,
  signout: SignOut,
  sso: SSO,
  reset: NewPasswordForm,
  myaccount: MyAccount,
}

export default class App extends Component {
  constructor(props) {
    super(props)

  }
  render() {
    const Page = routes[this.props.data.route]
    return (
      React.createElement(Page, {...this.props})
    )
  }
}
