'use strict'

import middlewareFactory from '../../lib/middleware_factory'

const validateRequest = (helpers) => (req, res, next) => {
  if (req.query.app) {
    next()
  } else {
    res.writeHead( 400, { 'Content-Type': 'text/html' } )
    res.end(helpers.form('error', { code: 400, reason: 'Bad Request' }))
  }
}

const validateAppThenStoreToLocals = middlewareFactory.create(
  'validateAppThenStoreToLocals',
  'byRequestQuery',
  'render_form_signin.js'
)

const final = (helpers) => (req, res) => {
  res.writeHead( 200, { "Content-Type": "text/html" } )
  res.end(helpers.form('signin', { app: res.locals.app }))
}

module.exports = [
  validateRequest,
  validateAppThenStoreToLocals,
  final
]
