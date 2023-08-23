"use strict"

const middlewareFactory = require('../../lib/middleware_factory')
const { decodeCookie, maskUser } = require('../../lib/util')

const validateRequest = (helpers) => (req, res, next) => {
  if (req.query.a && req.query.u) {
    next()
  } else {
    res.writeHead( 400, { 'Content-Type': 'text/html' } )
    res.end(helpers.form('query_account', { code: 400, reason: 'Bad Request' }))
  }
}

const validateAppThenStoreToLocals = middlewareFactory.create(
  'validateAppThenStoreToLocals',
  'byRequestQuery',
  'render_form_queryaccount.js'
)

const validateRequesterAuthority = (helpers) => (req, res, next) => {

  const cookies = req.cookies
  const app = res.locals.app

  decodeCookie(cookies, app)
  .then( session => {
    if (session) {
      next();
    } else {
      res.writeHead( 403, { 'Content-Type': 'text/html' } )
      res.end(helpers.form('query_account', { code: 403, reason: 'Permission Denied', app: {id: res.locals.app.id, url: res.locals.app.url}, }))
    }
  })
  .catch( err => {
    res.writeHead( 403, { 'Content-Type': 'text/html' } )
    res.end(helpers.form('query_account', { code: 403, reason: 'Permission Denied', app: {id: res.locals.app.id, url: res.locals.app.url}, }))
  })

}

const getAccount = (helpers) => async (req, res, next) => {
  try {
    res.locals.account = await helpers.Database.Account.find({ uid: req.query.u })
    next()
  } catch(err) {
    res.writeHead( 500, { 'Content-Type': 'text/html' } )
    res.end(helpers.form('query_account', { code: 500, reason: 'Error' }))
  }

}

const final = (helpers) => (req, res) => {
  res.writeHead( 200, { 'Content-Type': 'text/html' } )
  res.end(helpers.form('query_account', {
    app: {id: res.locals.app.id, url: res.locals.app.url},
    account: maskUser(res.locals.account),
   }))
}

module.exports = [
  validateRequest,
  validateAppThenStoreToLocals,
  validateRequesterAuthority,
  getAccount,
  final
]
