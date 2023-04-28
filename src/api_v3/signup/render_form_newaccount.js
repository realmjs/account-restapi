"use strict"

import jwt from 'jsonwebtoken';
import { hashEmail } from '../../lib/util';
import middlewareFactory from '../../lib/middleware_factory';

const validateRequest = (helpers) => (req, res, next) => {
  if (req.query.email && req.query.token && req.query.app) {
    next()
  } else {
    res.writeHead( 400, { "Content-Type": "text/html" } )
    res.end(helpers.form('error', { code: 400, reason: 'Bad query params' }))
  }
}

const decodeToken = (helpers) => (req, res, next) => {
  jwt.verify(req.query.token, process.env.EMAIL_VALLIDATION_SIGN_KEY, (err, decoded) => {
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
  if (hashEmail(req.query.email) === res.locals.hashedEmail) {
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
  helpers.database.account.find({ email: req.query.email })
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
  res.end(helpers.form('newaccount', { email: req.query.email, app: res.locals.app }))
}

module.exports = [
  validateRequest,
  decodeToken,
  verifyDecodedEmail,
  validateAppThenStoreToLocals,
  checkEmailExistence,
  final
]
