"use strict"

const middlewareFactory = require('../../lib/middleware_factory')
const { decodeCookie, maskUser, createSessionToken, alertCrashedEvent } = require('../../lib/util')

const validateRequest = (helpers) => (req, res, next) => {
  if (req.query.a) {
    next()
  } else {
    res.writeHead( 400, { 'Content-Type': 'text/html' } )
    res.end(helpers.form('sso', { code: 400, reason: 'Bad Request' }))
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
      res.locals.uid = session.uid
      res.locals.sid = session.sessionId
      next();
    } else {
      res.writeHead( 404, { 'Content-Type': 'text/html' } )
      res.end(helpers.form('sso', { code: 404, reason: 'No or Bad Cookie', app: {id: res.locals.app.id, url: res.locals.app.url}, }))
    }
  })
  .catch( err => {
    res.writeHead( 404, { 'Content-Type': 'text/html' } )
    res.end(helpers.form('sso', { code: 404, reason: 'No or Bad Cookie', app: {id: res.locals.app.id, url: res.locals.app.url}, }))
  })


}

const validateWithLoginSession = (helpers) => async (req, res, next) => {
  try {
    const session = await helpers.Database.LoginSession.find({ uid: res.locals.uid, sid: res.locals.sid });
    if (session) {
      next();
    } else {
      res.writeHead( 404, { 'Content-Type': 'text/html' } )
      res.end(helpers.form('sso', { code: 404, reason: 'No Session', app: {id: res.locals.app.id, url: res.locals.app.url}, }))
    }
  } catch (err) {
    res.writeHead( 404, { 'Content-Type': 'text/html' } )
    res.end(helpers.form('sso', { code: 404, reason: 'No Session', app: {id: res.locals.app.id, url: res.locals.app.url}, }))
  }
}

const getUserAccountByUID = (helpers) => (req, res, next) => {
  helpers.Database.Account.find({ uid: res.locals.uid })
  .then( user => {
    if (user) {
      res.locals.user = user
      next()
    } else {
      res.writeHead( 404, { 'Content-Type': 'text/html' } )
      res.end(helpers.form('sso', { code: 404, reason: 'No account', app: {id: res.locals.app.id, url: res.locals.app.url}, }))
    }
  })
  .catch( err =>
    helpers.alert && alertCrashedEvent(helpers.alert, 'render_form_sso.js', 'getUserAccountByUID', err)
  )
}

 const final = (helpers) => (req, res) => {
    res.writeHead( 200, { 'Content-Type': 'text/html' } )
    res.end(helpers.form('sso', {
      user: maskUser(res.locals.user),
      token: createSessionToken(res.locals.user.uid, res.locals.sid, res.locals.app.key),
      app: {id: res.locals.app.id, url: res.locals.app.url},
     }))
 }

module.exports = [
  validateRequest,
  validateAppThenStoreToLocals,
  getSessionFromCookie,
  validateWithLoginSession,
  getUserAccountByUID,
  final
]
