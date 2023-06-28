"use strict"

const jwt = require('jsonwebtoken')
const middlewareFactory = require('../../lib/middleware_factory')
const { verifyRealm, matchUserPassword, hashPassword } = require('../../lib/util')

const validateRequest = () => (req, res, next) => {
  if (req.body.token && req.body.password && req.body.app) {
    next()
  } else {
    res.status(400).send('Bad Request')
  }
}

const validateAppThenStoreToLocals = middlewareFactory.create(
  'validateAppThenStoreToLocals',
  'byRequestBody',
  'change_password.js'
)

const decodeToken = (helpers) => (req, res, next) => {
  jwt.verify(req.body.token, res.locals.app.key, (err, decoded) => {
    if (err || !decoded || !decoded.uid) {
      res.status(400).send('Bad Request')
    } else {
      res.locals.uid = decoded.uid
      next()
    }
  })
}

const getUserAccountByUid = (helpers) => (req, res, next) => {
  helpers.Database.Account.find({ uid: res.locals.uid })
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

const checkPassword = () => (req, res, next) => {
  if (matchUserPassword(res.locals.user, req.body.password.current)) {
    next()
  } else {
    res.status(403).send('Forbidden')
  }
}

const changePassword = (helpers) => (req, res, next) => {
  const password = req.body.password.new
  const salty = res.locals.user.salty
  helpers.Database.Account.update({ uid: res.locals.uid }, 'credentials.password', hashPassword(password, salty))
  .then(() => next())
  .catch( err =>
    helpers.alert && alertCrashedEvent(helpers.alert, 'change_password.js', 'changePassword', err)
  )
}

const final = () => (req, res) => res.status(200).json({ message: 'password changed' })

module.exports = [
  validateRequest,
  validateAppThenStoreToLocals,
  decodeToken,
  getUserAccountByUid,
  checkPassword,
  changePassword,
  final
]
