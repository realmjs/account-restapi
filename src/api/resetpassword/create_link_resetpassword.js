"use strict"

const jwt = require('jsonwebtoken')

const middlewareFactory = require('../../lib/middleware_factory')
const { isEmail, alertCrashedEvent, verifyRealm } = require('../../lib/util')

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
  'create_link_resetpassword.js'
)

const checkEmailExistence = (helpers) => (req, res, next) => {
  helpers.Database.Account.find({ email: req.body.email })
  .then( user => {
    if (user) {
      res.locals.user = user
      next()
    } else {
      res.status(404).send('Email is not registered')
    }
  })
  .catch( err =>
    helpers.alert && alertCrashedEvent(helpers.alert, 'create_link_resetpassword.js', 'checkEmailExistence', err)
  )
}

const checkRealm = () => (req, res, next) => {
  if (verifyRealm(res.locals.app, res.locals.user)) {
    next()
  } else {
    res.status(403).send('Realm forbidden')
  }
}

const createResetLink = () => (req, res, next) => {
  res.locals.token = jwt.sign(
    { uid: res.locals.user.uid },
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
    helpers.hook.sendEmail({
      to: { address: email, name: res.locals.user.profile.fullname },
      template: 'reset_password',
      data: { link: `${account.url}/form/account/newpassword?a=${app}&t=${token}` }
    })
    .then( () => next() )
  })
  .catch( err =>
    helpers.alert && alertCrashedEvent(helpers.alert, 'create_link_resetpassword.js', 'sendEmail', err)
  )
}

const final = () => (req, res) => res.status(200).send()

module.exports = [
  validateRequest,
  validateAppThenStoreToLocals,
  checkEmailExistence,
  checkRealm,
  createResetLink,
  sendEmail,
  final
]
