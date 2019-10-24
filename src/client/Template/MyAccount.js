"use strict"

import React, { Component, PureComponent } from 'react'

import xhttp from '@realmjs/xhttp-request'

import NewPasswordBox from './CommonWidget/NexPasswordBox'

import PasswordInput from './CommonWidget/PasswordInput'
import RequestResetPasswordIframe from './CommonWidget/RequestResetPasswordIframe'
import Toast from './CommonWidget/Toast'

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
        this.props.toast({title: 'Error', message: 'Password changed failed!', color: 'red'})
        done && done(`Error ${status}`)
      }
    })
    .catch( error => {
      this.props.toast({title: 'Error', message: 'Password changed failed!', color: 'red'})
      done && done(error)
    })
  }
}

class TabProfile extends PureComponent {
  constructor(props) {
    super(props)
    const profile = this.props.user && this.props.user.profile || undefined
    this.state = {
      error: {},
      syncing: false,
      ...this.getProfile()
    }
    this.resetState = this.resetState.bind(this)
    this.updateProfile = this.updateProfile.bind(this)
  }
  render() {
    return (
      <div>
        {/* Full Name */}
        <p >
          <span >
            <label>Full Name</label>
            <label className="w3-right w3-text-red"> {this.state.error.fullName} </label>
            <input className={`w3-input w3-border ${this.state.error.fullName? 'w3-border-red': ''}`}
                    type="text"
                    value={this.state.fullName}
                    onChange={this.getTyped('fullName')}
            />
          </span>
        </p>
        {/* Display Name */}
        <p>
          <span className="w3-mobile" style={{width: '100%', display: 'inline-block'}}>
            <label>Display Name</label>
            <label className="w3-right w3-text-red"> {this.state.error.displayName} </label>
            <input  className={`w3-input w3-border ${this.state.error.displayName? 'w3-border-red': ''}`}
                    type="text"
                    value={this.state.displayName}
                    onChange = {this.getTyped('displayName')}
            />
          </span>
        </p>
        {/* Gender */}
        <p>
          <label style={{marginRight: '4px'}}> Gender: </label>

          <input className="w3-radio" style={{marginRight: '4px'}} type="radio" name="gender" value="male"
                 checked={this.state.gender === 'male'}
                 onChange = { () => this.setState({gender: 'male'}) }
          />
          <label>Male</label>

          <label style={{marginRight: '12px'}} />

          <input className="w3-radio" style={{marginRight: '4px'}} type="radio" name="gender" value="female"
                 checked={this.state.gender === 'female'}
                 onChange = { () => this.setState({gender: 'female'}) }
          />
          <label>Female</label>
        </p>
        {/* Birthday */}
        <p>
          <span className="w3-mobile" style={{width: '35%', display: 'inline-block'}}>
            <label>Birthday</label>
            <label className="w3-right w3-text-red"> {this.state.error.birthday} </label>
            <input  className = {`w3-input w3-border ${this.state.error.birthday? 'w3-border-red': ''}`}
                    type="text"
                    placeholder="dd/mm/yyyy"
                    value={this.state.birthday}
                    onChange = {e => this.getTypedBirthday(e)}
            />
          </span>
        </p>
        {/* Emails */}
        <p>
          <label>Email</label>
          <label className="w3-right w3-text-red"> {this.state.error.email} </label>
          {
            this.state.email.map((email, index) => {
              return (
                <span  key = {index} style={{display: 'block', marginBottom: '4px'}}>
                  <input  className = {`w3-input w3-border ${this.state.error.email? 'w3-border-red': ''}`}
                          type = "text"
                          value = {email}
                          disabled = {index === 0}
                          onChange = {this.getTyped('email', index)}
                  />
                </span>
              )
            })
          }
          <label  className = "w3-text-blue"
                  style = {{cursor: 'pointer', display: 'block'}}
                  onClick = {this.addMoreBox('email')} >
            + Add more email
          </label>
        </p>
        {/* Phones */}
        <p>
          <label>Phone</label>
          <label className="w3-right w3-text-red"> {this.state.error.phone} </label>
          {
            this.state.phone.map((phone, index) => {
              return (
                <span  key = {index} style={{display: 'block', marginBottom: '4px'}}>
                  <input  className = {`w3-input w3-border ${this.state.error.phone? 'w3-border-red': ''}`}
                          type = "text"
                          value = {phone}
                          onChange = {this.getTyped('phone', index)}
                  />
                </span>
              )
            })
          }
          <label  className = "w3-text-blue"
                  style = {{cursor: 'pointer', display: 'block'}}
                  onClick = {this.addMoreBox('phone')} >
            + Add more phone number
          </label>
        </p>
        {/* Address */}
        <p>
          <label>Address</label>
          <input  className="w3-input w3-border"
                  type="text"
                  value={this.state.address}
                  onChange = {this.getTyped('address')}
          />
        </p>
        <hr />
        <p>
          <button className="w3-button w3-blue w3-hover-blue w3-hover-opacity" onClick={this.updateProfile} disabled={this.isChanged() || this.state.syncing} > Save </button>
          <label style={{marginRight: '8px'}} />
          <button className="w3-button" onClick={this.resetState} disabled={this.isChanged() || this.state.syncing} > Reset </button>
        </p>
      </div>
    )
  }
  getTyped(target, index) {
    if (index !== undefined) {
      return (evt) => {
        const state = {}
        state[target] = [...this.state[target]]
        state[target][index] = evt.target.value
        this.setState(state)
      }
    } else {
      return (evt) => {
        const state = {}
        state[target] = evt.target.value
        this.setState(state)
      }
    }
  }
  getTypedBirthday(evt) {
    const str = evt.target.value.trim().replace(/\/\/+/, '/')
    // skip if there's any non-digit (except splash/ charactor)
    if (/[^0-9]/g.test(str.replace(/\//g,''))) {
      return
    }
    // skip if not follow format dd/mm/
    if (/(^\d\d\d+\/|\/\d\d\d+\/)/.test(str)) {
      return
    }
    // handle backspace
    const last = this.state.birthday.replace(/.$/, '')
    if (str === last) {
      if (/\d\//.test(this.state.birthday)) {
        this.setState({ birthday: str.replace(/\d$/, '') })
      } else {
        this.setState({ birthday: str })
      }
      return
    }
    // auto insert /
    if (/(^\d\d$|^\d+\/\d\d$)/.test(str)) {
      this.setState({ birthday: str + '/' })
      return
    }
    // limit to dd/mm/yyyy
    if (/(^\d+\/\d+\/\d\d\d\d.$)/.test(str)) {
      return
    }
    this.setState({ birthday: str})
  }
  checkBirthday(bday) {
    if (!bday || bday.length === 0) { return true } // birthday is empty ot not use
    const dd = bday.match(/^\d+\//)[0].replace(/\//g,'')
    const mm = bday.match(/\/\d+\//)[0].replace(/\//g,'')
    const yyyy = bday.match(/\/\d+$/)[0].replace(/\//g,'')
    // validate year
    if (parseInt(yyyy) < 1900 || parseInt(yyyy) > parseInt((new Date()).getFullYear())) {
      console.error('Invalid Year!')
      return false
    }
    // validate month
    if (parseInt(mm) < 1 || parseInt(mm) > 12) {
      console.error('Invalid Month!')
      return false
    }
    // validate day
    if (parseInt(dd) > parseInt((new Date(yyyy, mm, 0)).getDate())) {
      console.error('Invalid Day!')
      return false
    }
    console.log('Valid Date!')
    return true
  }
  addMoreBox(box) {
    return (evt) => {
      const _state = {}
      const _container = [...this.state[box]]
      _container.push('');
      _state[box] = _container;
      this.setState({ ..._state })
    }
  }
  isChanged() {
    const profile = this.getProfile()
    if (!profile) { return false }
    return Object.keys(profile).every(key => this.state[key] === profile[key])
  }
  resetState() {
    this.setState({ ...this.getProfile(), error: {}, syncing: false })
  }
  getProfile() {
    const profile = this.props.user && this.props.user.profile || undefined
    return {
      fullName: profile && profile.fullName || '',
      displayName: profile && profile.displayName || '',
      gender: profile && profile.gender || '',
      email: profile && profile.email || [''],
      address: profile && profile.address || '',
      phone: profile && profile.phone || [''],
      birthday: profile && profile.birthday || '',
      picture: profile && profile.picture || ''
    }
  }
  getChangedProps() {
    const changed = {}
    const origin = this.getProfile()
    for (let prop in origin) {
      if ({}.toString.call(this.state[prop]) === '[object Array]') {
        changed[prop] = this.state[prop].filter(i => i.length > 0)
      } else {
        if ({}.toString.call(this.state[prop]) === '[object String]' && this.state[prop].length === 0) { continue }
        changed[prop] = this.state[prop]
      }
      /* changed: get the full prop from state to write to db
      if (origin[prop] !== this.state[prop]) {
        console.log(prop + ':' + {}.toString.call(this.state[prop]))
        if ({}.toString.call(this.state[prop]) === '[object Array]') {
          if (this.isEquivalentArray(origin[prop], this.state[prop])) { continue }
          changed[prop] = this.state[prop].filter(i => i.length > 0)
        } else {
          // if ({}.toString.call(this.state[prop]) === '[object String]' && this.state[prop].length === 0) { continue }
          changed[prop] = this.state[prop]
        }
      }
      */
    }
    return changed
  }
  isEquivalentArray(a, b) {
    const _a = a.filter(i => i.length > 0)
    const _b = b.filter(i => i.length > 0)
    if (_a.length !== _b.length) { return false }
    for (let i = 0; i < _a.length; i++) {
      if (_a[i] !== _b[i]) { return false }
    }
    return true
  }
  updateProfile() {
    // validate props
    const error = {}
    if (!this.checkBirthday(this.state.birthday)) {
      error.birthday = 'Invalid birthday'
    }
    if (this.state.fullName.length === 0) {
      error.fullName = 'Must not be blank'
    }
    if (this.state.displayName.length === 0) {
      error.displayName = 'Must not be blank'
    }
    if (Object.keys(error).length > 0) {
      this.setState({ syncing: false, error })
      return
    }
    const profile = this.getChangedProps()
    this.setState({ syncing: true, error: {} })
    xhttp.put('/me/profile', { profile, token: this.props.token })
    .then( ({status, profile}) => {
      if (status === 200) {
        this.props.toast({title: 'Success', message: `Profile updated`, color: 'blue'})
        this.setState({ ...profile, syncing: false })
      } else {
        this.props.toast({title: 'Error', message: `${status} Update failed!`, color: 'red'})
        this.setState({ syncing: false })
      }
    })
    .catch( error => {
      this.props.toast({title: 'Error', message: 'Update failed!', color: 'red'})
    })
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


/* Default export */
export default class MyAccount extends Component {
  constructor(props) {
    super(props)
    this.state = { tab: 'profile', user: null, toast: undefined }
    this.tabs = [
      { icon: 'fas fa-key', name: 'password', label: 'change password' },
      { icon: 'far fa-address-card', name: 'profile', label: 'profile' }
    ]
    this.toast = this.toast.bind(this)
    xhttp.get('/session?app=account&return=json')
    .then( ({status, responseText}) => {
      if (status === 200) {
        const res = JSON.parse(responseText)
        const user = res && res.session ? res.session.user : undefined
        const token = res && res.session ? res.session.token : undefined
        this.setState({ user, token })
      } else {
        console.log(`SSO status: ${status}`)
        this.setState({ user: undefined, token: undefined })
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
              toast = {this.toast}
              user = { this.state.user }
              token = { this.state.token }
              {...this.props}
        />
        <Toast  display = {this.state.toast !== undefined}
                toast = {this.state.toast}
                close = {e => this.setState({toast: undefined})}
        />
      </div>
    )
  }
  toast({icon, title, message, color}) {
    this.setState({ toast: {icon, title, message, color} })
  }

}
