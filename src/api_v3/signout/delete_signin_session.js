"use strict"

import middlewareFactory from '../../lib/middleware_factory'
import { decodeCookie, cleanCookieMiddleware } from '../../lib/util'

const validateRequest = () => (req, res, next) => {
  if (req.body.app && req.body.sid) {
    next()
  } else {
    res.status(400).send('Bad Request')
  }
}

const validateAppThenStoreToLocals = middlewareFactory.create(
  'validateAppThenStoreToLocals',
  'byRequestBody',
  'delete_signin_session.js'
)

const getSessionFromCookie = (helpers) => (req, res, next) => {

  const cookies = req.cookies
  const app = res.locals.app

  decodeCookie(cookies, app)
  .then( session => {
    if (session && session.sessionId && session.sessionId === req.body.sid) {
      next();
    } else {
      res.status(400).send('Bad Request')
    }
  })
  .catch( err => {
    res.status(400).send('Bad Request')
  })

}

const final = () => (req, res) => res.status(200).send()

module.exports = [
  validateRequest,
  validateAppThenStoreToLocals,
  getSessionFromCookie,
  cleanCookieMiddleware,
  final
]
