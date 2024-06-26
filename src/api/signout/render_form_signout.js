"use strict"

const jwt = require('jsonwebtoken')
const middlewareFactory = require('../../lib/middleware_factory')

const validateRequest = (helpers) => (req, res, next) => {
  if (req.query.a && req.query.t) {
    next()
  } else {
    res.writeHead( 400, { 'Content-Type': 'text/html' } )
    res.end(helpers.form('error', { code: 400, reason: 'Bad Request' }))
  }
}

const validateAppThenStoreToLocals = middlewareFactory.create(
  'validateAppThenStoreToLocals',
  'byRequestQuery',
  'render_form_signout.js'
)

const extractSessionId = (helpers) => (req, res, next) => {
  jwt.verify(req.query.t, res.locals.app.key, (err, decoded) => {
    if (err) {
      res.writeHead( 403, { 'Content-Type': 'text/html' } )
      res.end(helpers.form('error', { code: 403, reason: 'Permission Denied' }))
    } else {
      res.locals.sid = decoded.sid
      next();
    }
  });
}

const final = (helpers) => (req, res) => {
  res.writeHead( 200, { "Content-Type": "text/html" } )
  res.end(helpers.form('signout', { app: {id: res.locals.app.id, url: res.locals.app.url}, sid: res.locals.sid }))
}

module.exports = [
  validateRequest,
  validateAppThenStoreToLocals,
  extractSessionId,
  final
]