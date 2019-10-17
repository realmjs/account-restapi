"use strict"

import React, { Component, PureComponent } from 'react'

import xhttp from '@realmjs/xhttp-request'

import NewPasswordBox from './CommonWidget/NexPasswordBox'

import PasswordInput from './CommonWidget/PasswordInput'
import RequestResetPasswordIframe from './CommonWidget/RequestResetPasswordIframe'

function _titleCase(str) {
  return str.charAt(0).toUpperCase() + str.substring(1)
}

class SideBar extends PureComponent {
  constructor(props) {
    super(props)
  }
  render() {
    return (
      <div className="w3-sidebar w3-bar-block w3-border-right w3-hide-small" style={{background: 'none', width: '200px'}}>
        <h4 className="w3-bar-item">Menu</h4>
        {
          this.props.tabs.map( tab => (
            <button key = {tab.name} className={`w3-bar-item w3-button  ${this.isActive(tab.name)? 'w3-blue': ''}`}
                 onClick={() => this.props.onSelectTab(tab.name)}
            >
              <i className={tab.icon}></i> { _titleCase(tab.label) }
            </button>
          ))
        }
      </div>
    )
  }
  isActive(tab) {
    return this.props.activeTab === tab
  }
}

class TabPassword extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      display: 'password',
      password: '',
      newPassword: '',
    }
    this.onConfirmPassword = this.onConfirmPassword.bind(this)
    this.onConfirmNewPassword = this.onConfirmNewPassword.bind(this)
  }
  render() {
    return (
      <div>
        <div style={{ display: this.display('password') }} >
          <p className="w3-text-blue"> Submit your password to unlock feature</p>
          <PasswordInput  active = {this.state.display === 'password'}
                          onConfirm = {this.onConfirmPassword}
                          onForgetPassword = {e => this.setState({ display: 'forget-password'})}
          />
        </div>
        <div style={{ display: this.display('forget-password') }} >
          <RequestResetPasswordIframe form = {{email: this.props.user.username}}
                                      active = {this.state.display === 'forget-password'}
          />
        </div>
        <div style={{ display: this.display('new-password') }} >
          <h4> Change Password </h4>
          <NewPasswordBox   onConfirm = {this.onConfirmNewPassword}
                            btnLabel = 'Submit new password'
                            icon = ''
          />
        </div>
        <div style={{ display: this.display('success') }} >
          <h4> Change Password </h4>
          <p className = 'w3-text-green'> Password updated! </p>
        </div>
      </div>
    )
  }
  display(state) {
    return this.state.display === state ? 'block' : 'none'
  }
  onConfirmPassword(password, done) {
    const username = this.props.user.username
    xhttp.post('/session', {username, password})
    .then( ({status}) => {
      if (status === 200) {
        this.setState({ password, display: 'new-password' })
        done && done()
      } else {
        done && done('Invalid password')
      }
    })
    .catch( error => done && done(error))
  }
  onConfirmNewPassword(password, done) {
    xhttp.put('/me/password', {
      username: this.props.user.username,
      password: this.state.password,
      newPassword: password
    })
    .then( ({status}) => {
      if (status === 200) {
        this.setState({ newPassword: password, display: 'success' })
        done && done()
      } else {
        done && done(`Error ${status}`)
      }
    })
    .catch( error => done && done(error))
  }
}

class TabProfile extends PureComponent {
  constructor(props) {
    super(props)
  }
  render() {
    return (
      <div>Profile</div>
    )
  }
}

class Tabs extends PureComponent {
  constructor(props) {
    super(props)
    this.state = { showDropdown: false }
    this.toggleDropdown = this.toggleDropdown.bind(this)
    this.tabs = { TabPassword, TabProfile }
  }
  render() {
    return (
      <div className="w3-row">
        <div className="w3-col  w3-hide-small" style={{width: '200px', height: '10px'}} />
        <div className="w3-rest w3-container">
          { this.renderDropdown() }
          { this.renderTab(this.props.activeTab) }
        </div>
      </div>
    )
  }
  renderDropdown() {
    return (
      <div onClick={this.toggleDropdown} style={{background:'none', width: '100%'}}>
        <h4 style={{marginTop: '16px'}}> {this.props.activeTab.toUpperCase()} <i className="fa fa-caret-down w3-hide-medium w3-hide-large" /> </h4>
        <div className={`w3-dropdown-content w3-bar-block w3-card-4 w3-hide-medium w3-hide-large`} style={{backgroundColor: '#f1f1f1', display: this.state.showDropdown? 'block': 'none'}}>
        {
          this.props.tabs.map(tab => (
            <button key={tab.name}  className={`w3-bar-item w3-button w3-border-bottom`} onClick={() => this.props.onSelectTab(tab.name)}>
              <i className={`fa ${tab.icon}`}></i> { _titleCase(tab.label) }
            </button>
          ))
        }
        </div>
      </div>
    )
  }
  renderTab(tab) {
    return React.createElement(this.tabs[`Tab${_titleCase(tab)}`], {
      ...this.props
    })
  }
  toggleDropdown() {
    this.setState({ showDropdown: !this.state.showDropdown })
  }
}

export default class extends Component {
  constructor(props) {
    super(props)
    this.state = { tab: 'password', user: null }
    this.tabs = [
      { icon: 'fas fa-key', name: 'password', label: 'change password' },
      { icon: 'far fa-address-card', name: 'profile', label: 'profile' }
    ]
    xhttp.get('/session?app=account&return=json')
    .then( ({status, responseText}) => {
      if (status === 200) {
        const res = JSON.parse(responseText)
        const user = res && res.session ? res.session.user : undefined
        this.setState({ user })
      } else {
        console.log(`SSO status: ${status}`)
        this.setState({ user: undefined })
      }
    })
    .catch(err => console.log(`SSO error: ${err}`))
  }
  render() {
    const user = this.state.user
    if (user === null) { return null }
    if (user === undefined) { return (<div className="w3-container" style={{width: '320px', margin: '64px auto'}}>You need to Login to use this page</div>) }
    return(
      <div className = "">
        <SideBar  tabs = {this.tabs}
                  activeTab = {this.state.tab}
                  onSelectTab = { (tab) => this.setState({ tab }) }
        />
        <Tabs tabs = {this.tabs}
              activeTab = {this.state.tab}
              onSelectTab = { (tab) => this.setState({ tab }) }
              user = { this.state.user }
              {...this.props}
        />
      </div>
    )
  }
}
