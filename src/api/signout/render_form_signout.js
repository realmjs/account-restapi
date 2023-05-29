"use strict"

const middlewareFactory = require('../../lib/middleware_factory')

const validateRequest = (helpers) => (req, res, next) => {
  if (req.query.a && req.query.s) {
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

const final = (helpers) => (req, res) => {
  res.writeHead( 200, { "Content-Type": "text/html" } )
  res.end(helpers.form('signout', { app: {id: res.locals.app.id, url: res.locals.app.url}, sid: req.query.s }))
}

module.exports = [
  validateRequest,
  validateAppThenStoreToLocals,
  final
]