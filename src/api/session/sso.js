"use strict"

const { generateAuthenTokenMiddleware, serializeUser, decodeCookie } = require('../../lib/util')

function validateParameters(helpers) {
  return function(req, res, next) {
    if (!(req.query && req.query.app)) {
      helpers.alert &&  helpers.alert('Bad Request: Missing app in query')
      const data = { route: 'error', error: {code: 400, detail: 'Bad request'} }
      res.writeHead( 400, { "Content-Type": "text/html" } )
      res.end(html({title: 'Error', data, script: process.env.SCRIPT, style: false}))
      return
    }
    const app = helpers.Apps.find( app => app.id === req.query.app )
    if (app) {
      req.app = app
      next()
    } else {
      const data = { route: 'error', error: {code: 404, detail: 'App not found'} }
      res.writeHead( 404, { "Content-Type": "text/html" } )
      res.end(html({title: 'Error', data, script: process.env.SCRIPT, style: false}))
    }
  }
}

function getSession() {
  return function(req, res, next) {
    const cookies = req.cookies
    const app = req.app
    decodeCookie(cookies)
    .then( session => { req.uid = session.uid; next(); })
    .catch( err => {
      if (err === 'no_cookie') {
        const data = { route: 'sso', targetOrigin: app.url, status: 200, session: null }
        res.end(html({title: 'SSO', data, script: process.env.SCRIPT, style: false}))
      } else {
        const data = { route: 'error', targetOrigin: app.url, error: {code: 400, detail: 'Bad request'} }
        res.writeHead( 400, { "Content-Type": "text/html" } )
        res.end(html({title: 'Error', data, script: process.env.SCRIPT, style: false}))
      }
    })
  }
}

function findUser(helpers) {
  return function(req, res, next) {
    const app = req.app
    helpers.Database.USERS.find({ uid: `= ${req.uid}`})
    .then( users => {
      if (users && users.length > 0) {
        req.user = users[0]
      } else {
        const data = { route: 'error', targetOrigin: app.url, error: {code: 404, detail: 'no user'} }
        res.writeHead( 404, { "Content-Type": "text/html" } )
        res.end(html({title: 'Error', data, script: process.env.SCRIPT, style: false}))
      }
    })
    .catch( err => res.status(403).json({ error: '[1] Unable to access Database' }))
  }
}

function responseSuccess() {
  return function(req, res) {
    const app = req.app
    const data = { route: 'sso', targetOrigin: app.url, status: 200, session: { user: serializeUser(req.user), token: req.authenToken } }
    res.end(html({title: 'SSO', data, script: process.env.SCRIPT, style: false}))
  }
}

module.exports = [validateParameters, getSession, findUser, generateAuthenTokenMiddleware, responseSuccess]
