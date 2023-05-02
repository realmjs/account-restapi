"use strict"

import { isEmail } from '../../lib/form'
import middlewareFactory from '../../lib/middleware_factory'
import { alertCrashedEvent, matchUserPassword, createCookie, maskUser, createSessionToken } from '../../lib/util'

const validateRequest = () => (req, res, next) => {
  if (req.body.email && isEmail(req.body.email) && req.body.password && req.body.app) {
    next()
  } else {
    res.status(400).send('Bad Request')
  }
}

const validateAppThenStoreToLocals = middlewareFactory.create(
  'validateAppThenStoreToLocals',
  'byRequestBody',
  'create_signin_session.js'
)

const getUserAccountByEmail = (helpers) => (req, res, next) => {
  helpers.database.account.find({ email: req.body.email })
  .then( user => {
    if (user) {
      res.locals.user = user
      next()
    } else {
      res.status(401).send('Unauthenticated')
    }
  })
  .catch( err =>
    helpers.alert && alertCrashedEvent(helpers.alert, 'create_signin_session.js', 'checkEmailExistence', err)
  )
}

const checkRealm = () => (req, res, next) => {
  const realm = res.locals.app.realm
  if (Object.keys(res.locals.user.realms).indexOf(realm) !== -1 && 
      res.locals.user.realms[realm].roles &&
      res.locals.user.realms[realm].roles.length > 0) 
  {
    next()
  } else {
    res.status(401).send('Unauthenticated')
  }
}

const checkPassword = () => (req, res, next) => {
  if (matchUserPassword(res.locals.user, req.body.password)) {
    next()
  } else {
    res.status(401).send('Unauthenticated')
  }
}

const setCookie = () => (req, res, next) => {
  const cookie = createCookie(res.locals.user.uid, res.locals.app.realm)
  res.locals.sessionId = JSON.parse(cookie[1]).sessionId
  res.cookie(...cookie)
  next()
}

const final = () => (req, res) => res.status(200).json({
  user: maskUser(res.locals.user),
  token: createSessionToken(res.locals.user, res.locals.app),
  sid: res.locals.sessionId
})

module.exports = [
  validateRequest,
  validateAppThenStoreToLocals,
  getUserAccountByEmail,
  checkRealm,
  checkPassword,
  setCookie,
  final
]
