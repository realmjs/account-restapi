"use strict"

const Builder = require('express-api-builder')

const api = Builder()

api.use(require('cookie-parser')())

/* API Sign up
step 1: GET form/signup/email
step 2: POST link/signup
step 3: GET form/account/new
step 3: POST account
*/

api.add('/form/signup', {
  get: require('./signup/render_form_signup')
})

api.add('/link/signup', {
  post: require('./signup/create_link_signup')
})

api.add('/form/account/new', {
  get: require('./signup/render_form_newaccount')
})

api.add('/account', {
  post: require('./signup/create_newaccount')
})

/* API Sign up
step 1: GET form/signin
step 2: POST session
*/

api.add('/form/signin', {
  get: require('./signin/render_form_signin')
})

api.add('/session', {
  post: require('./signin/create_signin_session')
})

module.exports = api