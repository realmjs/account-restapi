"use strict"

const middlewareFactory = require('../../lib/middleware_factory')
const { decodeCookie, cleanCookieMiddleware } = require('../../lib/util')

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
      res.locals.session = session;
      next();
    } else {
      res.status(400).send('Bad Request')
    }
  })
  .catch( err => {
    res.status(400).send('Bad Request')
  })

}

const removeLoginSession = (helpers) => async (req, res, next) => {
  try {
    const { uid, sessionId } = res.locals.session;
    await helpers.Database.LoginSession.remove({ uid, sid: sessionId });
    next()
  } catch (err) {
    helpers.alert && alertCrashedEvent(helpers.alert, 'delete_signin_session.js', 'removeLoginSession', err)
  }
}

const final = () => (req, res) => res.status(200).send()

module.exports = [
  validateRequest,
  validateAppThenStoreToLocals,
  getSessionFromCookie,
  cleanCookieMiddleware,
  removeLoginSession,
  final
]
