"use strict"

const middlewareFactory = require('../../lib/middleware_factory')
const { decodeCookie, maskUser, createSessionToken } = require('../../lib/util')

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
      res.writeHead( 400, { 'Content-Type': 'text/html' } )
      res.end(helpers.form('sso', { code: 400, reason: 'Bad Cookie', app: {id: res.locals.app.id, url: res.locals.app.url}, }))
    }
  })
  .catch( err => {
    res.writeHead( 400, { 'Content-Type': 'text/html' } )
    res.end(helpers.form('sso', { code: 400, reason: 'Bad Cookie', app: {id: res.locals.app.id, url: res.locals.app.url}, }))
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
      res.end(helpers.form('sso', { code: 404, reason: 'No account', app: {id: res.locals.app.id, url: res.locals.app.url}, }))
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
      sid: res.locals.sid,
      app: {id: res.locals.app.id, url: res.locals.app.url},
     }))
 }

module.exports = [
  validateRequest,
  validateAppThenStoreToLocals,
  getSessionFromCookie,
  getUserAccountByUID,
  final
]
