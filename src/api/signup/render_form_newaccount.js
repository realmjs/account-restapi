"use strict"

const jwt = require('jsonwebtoken')
const { hashEmail } = require('../../lib/util')
const middlewareFactory = require('../../lib/middleware_factory')

const validateRequest = (helpers) => (req, res, next) => {
  if (req.query.e && req.query.t && req.query.a) {
    next()
  } else {
    res.writeHead( 400, { "Content-Type": "text/html" } )
    res.end(helpers.form('error', { code: 400, reason: 'Bad query params' }))
  }
}

const decodeToken = (helpers) => (req, res, next) => {
  jwt.verify(req.query.t, process.env.EMAIL_VALLIDATION_SIGN_KEY, (err, decoded) => {
    if (err || !decoded || !decoded.email) {
      res.writeHead( 400, { "Content-Type": "text/html" } )
      res.end(helpers.form('error', { code: 400, reason: 'Bad Signature' }))
    } else {
      res.locals.hashedEmail = decoded.email
      next()
    }
  })
}

const verifyDecodedEmail = (helpers) => (req, res, next) => {
  if (hashEmail(req.query.e) === res.locals.hashedEmail) {
    next()
  } else {
    res.writeHead( 400, { "Content-Type": "text/html" } )
    res.end(helpers.form('error', { code: 400, reason: 'Invalid Email' }))
  }
}

const validateAppThenStoreToLocals = middlewareFactory.create(
  'validateAppThenStoreToLocals',
  'byRequestQuery',
  'render_form_newaccount.js'
)

const checkEmailExistence = (helpers) => (req, res, next) => {
  helpers.database.account.find({ email: req.query.e })
  .then( user => {
    if (user) {
      res.writeHead( 409, { "Content-Type": "text/html" } )
      res.end(helpers.form('error', { code: 409, reason: 'Registered Email' }))
    } else {
      next()
    }
  })
  .catch( err =>
    helpers.alert && alertCrashedEvent(helpers.alert, 'post_link_signup.js', 'checkEmailExistence', err)
  )
}

const final = (helpers) => (req, res) => {
  res.writeHead( 200, { "Content-Type": "text/html" } )
  res.end(helpers.form('newaccount', { email: req.query.e, app: {id: res.locals.app.id, url: res.locals.app.url} }))
}

module.exports = [
  validateRequest,
  decodeToken,
  verifyDecodedEmail,
  validateAppThenStoreToLocals,
  checkEmailExistence,
  final
]
