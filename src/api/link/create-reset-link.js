"use strict"

const jwt = require('jsonwebtoken')

const html = require('../../lib/html')

function validateParams(helpers) {
  return function(req, res, next) {
    if (req.body && req.body.email && req.body.app) {
      const app = helpers.Apps.find( app => app.id === req.body.app )
      if (app) {
        req.app = app
        next()
      } else {
        res.redirect('/error/404')
      }
    } else {
      res.redirect('/error/400')
    }
  }
}

function findUser(helpers) {
  return function(req, res, next) {
    helpers.Database.LOGIN.find({ username: `= ${req.body.email}`})
      .then( users => {
        if (users && users.length > 0) {
          req.user = users[0]
          next()
        } else {
          res.redirect('/error/404')
        }
      })
      .catch( err => {
        helpers.alert && helpers.alert(err)
        res.redirect('/error/500')
      })
  }
}

function createToken() {
  return function(req, res, next) {
    req.token = jwt.sign({ uid: req.user.uid }, process.env.EMAIL_SIGN_KEY, { expiresIn: process.env.EXPIRE_RESET_LINK })
    next()
  }
}

function sendEmail(helpers) {
  return function(req, res, next) {
    const user = req.user
    const account = helpers.Apps.find(app => app.id === 'account')
    if (account) {
      helpers.sendEmail({
        recipient: [{ address: user.profile.email[0], name: user.profile.displayName }],
        template: 'resetemail',
        data: { customer: user.profile.displayName, endpoint:`${account.url}/form?name=reset&app=account`, token: req.token }
      })
      .then(next)
      .catch(err => {
        helpers.alert && helpers.alert(`Failed to send email to ${user.profile.displayName}[${user.profile.email[0]}]`)
        next()
      })
    } else {
      helpers.alert && helpers.alert('Cannot find account in environment variable APPS')
      const dom = `
        <div class="w3-container" style="margin: 32px 0">
          <h3 class="w3-text-red"> Opps! Something wrong happen </h3>
          <p class="w3-text-red">The server may be busy or not working</p>
          <p class="w3-text-grey"> Sorry for inconvenience. Please try again later </p>
        </div>
      `
      res.writeHead( 200, { "Content-Type": "text/html" } )
      res.end(html({ title: 'Failed', dom, data: {targetOrigin: req.app.url} }))
    }
  }
}

function render() {
  return function(req, res) {
    const dom = `
      <div class="w3-container" style="margin: 32px 0">
        <h3> Email Sent </h3>
        <p class="w3-text-red">An email has been sent to <span class="w3-text-blue">${req.body.email}</span>. Please check your inbox and follow the instruction.</p>
        <p class="w3-text-grey"> Thank you. </p>
      </div>
    `
    res.writeHead( 200, { "Content-Type": "text/html" } )
    res.end(html({ title: 'Success', dom, data: {targetOrigin: req.app.url} }))
  }
}

module.exports = [validateParams, findUser, createToken, sendEmail, render]
