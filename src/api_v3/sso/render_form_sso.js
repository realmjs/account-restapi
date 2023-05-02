"use strict"

import middlewareFactory from '../../lib/middleware_factory'
import { decodeCookie, maskUser, createSessionToken } from '../../lib/util'

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
  'render_form_sso.js'
)

const getSessionFromCookie = (helpers) => (req, res, next) => {

  const cookies = req.cookies
  const app = res.locals.app

  decodeCookie(cookies, app)
  .then( session => {
    if (session) {
      res.locals.uid = session.uid;
      res.locals.sid = session.sessionId;
      next();
    } else {
      res.writeHead( 400, { 'Content-Type': 'text/html' } )
      res.end(helpers.form('error', { code: 400, reason: 'Bad Cookie' }))
    }
  })
  .catch( err => {
    res.writeHead( 400, { 'Content-Type': 'text/html' } )
    res.end(helpers.form('error', { code: 400, reason: 'Bad Cookie' }))
  })

}

const getUserAccountByUID = (helpers) => (req, res, next) => {
  helpers.database.account.find({ uid: res.locals.uid })
  .then( user => {
    if (user) {
      res.locals.user = user
      next()
    } else {
      res.writeHead( 404, { 'Content-Type': 'text/html' } )
      res.end(helpers.form('error', { code: 404, reason: 'No account' }))
    }
  })
  .catch( err =>
    helpers.alert && alertCrashedEvent(helpers.alert, 'create_signin_session.js', 'checkEmailExistence', err)
  )
}

 const final = (helpers) => (req, res) => {
    res.writeHead( 200, { 'Content-Type': 'text/html' } )
    res.end(helpers.form('sso', { 
      user: maskUser(res.locals.user),
      token: createSessionToken(res.locals.user, res.locals.app),
      sid: res.locals.sid
     }))
 }

module.exports = [
  validateRequest,
  validateAppThenStoreToLocals,
  getSessionFromCookie,
  getUserAccountByUID,
  final
]
