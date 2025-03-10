'use strict'
const jwt = require('jsonwebtoken')
const { isEmail, alertCrashedEvent, hashEmail } = require('../../lib/util')
const middlewareFactory = require('../../lib/middleware_factory')

const validateRequest = () => (req, res, next) => {
  if (req.body.email && isEmail(req.body.email) && req.body.app) {
    next()
  } else {
    res.status(400).send('Bad Request')
  }
}

const validateAppThenStoreToLocals = middlewareFactory.create(
  'validateAppThenStoreToLocals',
  'byRequestBody',
  'create_link_signup.js'
)

const checkEmailExistence = (helpers) => (req, res, next) => {
  helpers.Database.Account.find({ email: req.body.email })
  .then( user => {
    if (user) {
      res.status(409).send('Email is registered')
    } else {
      next()
    }
  })
  .catch( err =>
    helpers.alert && alertCrashedEvent(helpers.alert, 'create_link_signup.js', 'checkEmailExistence', err)
  )
}

const createRegisterLink = () => (req, res, next) => {
  res.locals.token = jwt.sign(
    { email: hashEmail(req.body.email) },
    process.env.EMAIL_VALLIDATION_SIGN_KEY,
    { expiresIn: process.env.EMAIL_EXPIRE_VALIDATION_LINK }
  )
  next()
}

const sendEmail = (helpers) => (req, res, next) => {
  const email = req.body.email
  const token = res.locals.token
  const app = req.body.app
  helpers.Database.App.find({id: 'account'})
  .then(account => {
    helpers.hook && helpers.hook.sendEmail && helpers.hook.sendEmail({
      to: { address: req.body.email },
      template: 'AccountInvitationEmail',
      data: { link: `${account.url}/form/account/new?e=${email}&a=${app}&t=${token}` }
    })
    .then( () => next() )
    .catch( (err) => res.status(500).send('Failed to send signup link. Please try again later'))
  })
  .catch( err => {
    helpers.alert && alertCrashedEvent(helpers.alert, 'create_link_signup.js', 'sendEmail', err)
    res.status(404).send('Unknown app')
  })
}

const final = () => (req, res) => res.status(200).send('Register link is sent')

module.exports = [
  validateRequest,
  validateAppThenStoreToLocals,
  checkEmailExistence,
  createRegisterLink,
  sendEmail,
  final
]
