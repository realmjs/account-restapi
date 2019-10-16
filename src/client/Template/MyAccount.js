"use strict"

import React, { Component, PureComponent } from 'react'

import xhttp from '@realmjs/xhttp-request'

import NewPasswordBox from './CommonWidget/NexPasswordBox'

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

class PasswordInput extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      password: '',
      error: null,
      syncing: false,
    }
    this.textInput = React.createRef()
    this.getTypedPassword = this.getTypedPassword.bind(this)
    this.handleKeyUpForPassword = this.handleKeyUpForPassword.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
  }
  componentDidMount() {
    this.focusTextInput()
  }
  componentDidUpdate() {
    this.focusTextInput()
  }
  focusTextInput() {
    if (this.props.active) {
      this.textInput.current.focus()
    }
  }
  render() {
    return (
      <div>
        <p>
          <label className="w3-text-grey">Password</label>
          <label className="w3-right w3-text-red"> {this.state.error || ''} </label>
          <input  className = {`w3-input w3-border ${this.state.error && this.state.error.length > 0 ? 'w3-border-red' : ''}`}
                  type = "password"
                  placeholder = "password"
                  value = {this.state.password}
                  onChange = {this.getTypedPassword}
                  onKeyUp = {this.handleKeyUpForPassword}
                  ref={this.textInput}
          />
        </p>
        <div style = {{marginBottom: '42px'}}>
              <div className="w3-cell-row">
                <div className="w3-cell">
                <label className="w3-text-orange "><span style={{cursor: 'pointer'}} onClick = {e => this.props.navigate('reset')} > Forgot your password </span></label>
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
    this.props.onConfirm(password, error => this.setState({ error, syncing: false }))
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
        {/* Display Password Input : User need to enter correct password to unlock Change Password */}
        <div style={{ display: this.display('password') }} >
          <p className="w3-text-blue"> Submit your password to unlock feature</p>
          <PasswordInput  active = { this.state.display === 'password' }
                          onConfirm = {this.onConfirmPassword}
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
    setTimeout( _ => {
      if (password === '123') {
        this.setState({ password, display: 'new-password' })
        done && done()
      } else {
        done && done('Invalid password')
      }
    }, 1000)
  }
  onConfirmNewPassword(password, done) {
    setTimeout( _ => {
      if (password === '123') {
        this.setState({ newPassword: password, display: 'success' })
        done && done()
      } else {
        done && done('Error found')
      }
    }, 1000)
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
      user: this.props.user,
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
    this.state = { tab: 'password' }
    this.tabs = [
      { icon: 'fas fa-key', name: 'password', label: 'change password' },
      { icon: 'far fa-address-card', name: 'profile', label: 'profile' }
    ]
  }
  render() {
    return(
      <div className = "">
        <SideBar  tabs = {this.tabs}
                  activeTab = {this.state.tab}
                  onSelectTab = { (tab) => this.setState({ tab }) }
        />
        <Tabs tabs = {this.tabs}
              activeTab = {this.state.tab}
              onSelectTab = { (tab) => this.setState({ tab }) }
              user = { this.props.user }
              {...this.props}
        />
      </div>
    )
  }
}
