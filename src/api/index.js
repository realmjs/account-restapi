"use strict"

const Builder = require('express-api-builder')

const api = Builder()

api.use(require('cookie-parser')())

/*
  Apps are defined in environment variable in the pair of id|url, seperated by one space
  ex: APP="id|url id|url"
*/
api.helpers({
  Apps: process.env.APPS.split(' ').map( item => {
    const s = item.split('|')
    return { id: s[0], url: s[1] }
  })
})

/* forms */
api.add('/form', {
  get: require('./form/render-form')
})

/* users */
api.add('/users', {
  get: require('./users/find-users'),
  post: require('./users/create-user')
})

/* session */
api.add('/session', {
  get: require('./session/sso'),
  post: require('./session/create-session'),
  delete: require('./session/delete-session'),
})

/* link */
api
.add('/ln/verify', {
  get: require('./link/verify-email')
})
.add('/ln/mailverified', {
  get: require('./link/mail-verified')
})

/* error */
api.add('/error/:code', {
  get: require('./error/render-error-page')
})

module.exports = api
