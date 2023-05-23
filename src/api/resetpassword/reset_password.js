"use strict"

const jwt = require('jsonwebtoken')
const middlewareFactory = require('../../lib/middleware_factory')
const { alertCrashedEvent, hashPassword, verifyRealm } = require('../../lib/util')

const validateRequest = () => (req, res, next) => {
  if (req.body.token && req.body.password && req.body.app) {
    next()
  } else {
    res.status(400).send('Bad Request')
  }
}

const decodeToken = (helpers) => (req, res, next) => {
  jwt.verify(req.body.token, process.env.EMAIL_VALLIDATION_SIGN_KEY, (err, decoded) => {
    if (err || !decoded || !decoded.uid) {
      res.status(400).send('Bad Request')
    } else {
      res.locals.uid = decoded.uid
      next()
    }
  })
}

const validateAppThenStoreToLocals = middlewareFactory.create(
  'validateAppThenStoreToLocals',
  'byRequestBody',
  'reset_password.js'
)

const getUserAccountByUid = (helpers) => (req, res, next) => {
  helpers.database.account.find({ uid: res.locals.uid })
  .then( user => {
    if (user && verifyRealm(res.locals.app, user)) {
      res.locals.user = user
      next()
    } else {
      res.status(404).send('Not found')
    }
  })
  .catch( err =>
    helpers.alert && alertCrashedEvent(helpers.alert, 'reset_password.js', 'getUserAccountByUid', err)
  )
}

const changePassword = (helpers) => (req, res, next) => {
  const password = req.body.password
  const salty = res.locals.user.salty
  helpers.database.account.update({ uid: res.locals.uid }, 'credentials.password', hashPassword(password, salty))
  .then(() => next())
  .catch( err =>
    helpers.alert && alertCrashedEvent(helpers.alert, 'reset_password.js', 'changePassword', err)
  )
}

const final = () => (req, res) => res.status(200).json({ message: 'password changed' })

module.exports = [
  validateRequest,
  decodeToken,
  validateAppThenStoreToLocals,
  getUserAccountByUid,
  changePassword,
  final
]
