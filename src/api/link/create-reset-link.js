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
    helpers.sendEmail({
      recipient: [{ email: user.profile.email[0], name: user.profile.displayName }],
      template: 'resetemail',
      data: { token: req.token }
    }).catch(err => helpers.alert && helpers.alert(`Failed to send email to ${user.profile.displayName}[${user.profile.email[0]}]`))
    next()
  }
}

function render() {
  return function(req, res) {
    const dom = `
      <div class="w3-container" style="margin: 32px 0">
        <h3> Email Sent </h3>
        <p class="w3-text-red">An email has been sent to <span class="w3-text-blue">${req.body.email}</span>. Please check your inbox and follow the instruction.</p>
        <p class="w3-text-grey"> Thank you. </p>
        ${req.body.app !== 'account'? '<button class="w3-button w3-blue" onclick="xclose()" > Close </button>' : ''}
      </div>
      <script> function xclose(){ window.parent.postMessage({code:'iframe.close'}, __data.targetOrigin) } </script>
    `
    res.writeHead( 200, { "Content-Type": "text/html" } )
    res.end(html({ title: 'Success', dom, data: {targetOrigin: req.app.url} }))
  }
}

module.exports = [validateParams, findUser, createToken, sendEmail, render]
