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

api.add('/form/signup/email', {
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

/* API SSO */

api.add('/session/sso', {
  get: require('./sso/render_form_sso')
})

/* API Sign out
step 1: GET form/signout
step 2: DELETE session
*/

api.add('/form/signout', {
  get: require('./signout/render_form_signout')
})

api.add('/session', {
  delete: require('./signout/delete_signin_session')
})

/* API Reset password
step 1: POST link/resetpassword
step 2: GET form/account/newpassword
step 3: PUT account/password
*/

api.add('/link/resetpassword', {
  post: require('./resetpassword/create_link_resetpassword')
})

api.add('/form/account/newpassword', {
  get: require('./resetpassword/render_form_newpassword')
})

api.add('/account/password', {
  put: require('./resetpassword/reset_password')
})

/* API Change password
step 1: Get form/account/changepassword
step 2: PUT me/password
*/

api.add('/form/account/changepassword', {
  get: require('./changepassword/render_form_changepassword')
})

api.add('/me/password', {
  put: require('./changepassword/change_password')
})

module.exports = api
