"use strict"

import middlewareFactory from '../../lib/middleware_factory';

const validateRequest = (helpers) => (req, res, next) => {
  if (req.query.app) {
    next()
  } else {
    res.writeHead( 400, { "Content-Type": "text/html" } )
    res.end(helpers.form('error', { code: 400, reason: 'Bad Request' }))
  }
}

const validateAppThenStoreToLocals = middlewareFactory.create(
  'validateAppThenStoreToLocals',
  'byRequestQuery',
  'render_form_signup.js'
)

const final = (helpers) => (req, res) => {
  res.writeHead( 200, { "Content-Type": "text/html" } )
  res.end(helpers.form('signup', { app: req.query.app }))
}

module.exports = [
  validateRequest,
  validateAppThenStoreToLocals,
  final
]
