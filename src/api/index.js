"use strict"

const endpoint = require('@realmjs/account-endpoint')

const Builder = require('express-api-builder')
const api = Builder()

api.use(require('cookie-parser')())

/* API Sign up
step 1: GET form/signup/email
step 2: POST link/signup
step 3: GET form/account/new
step 3: POST account
*/

api.add(endpoint.Form.Signup, {
  get: require('./signup/render_form_signup')
})

api.add(endpoint.Link.Signup, {
  post: require('./signup/create_link_signup')
})

api.add(endpoint.Form.NewAccount, {
  get: require('./signup/render_form_newaccount')
})

api.add(endpoint.Account.New, {
  post: require('./signup/create_newaccount')
})

/* API Sign up
step 1: GET form/signin
step 2: POST session
*/

api.add(endpoint.Form.Signin, {
  get: require('./signin/render_form_signin')
})

api.add(endpoint.Session, {
  post: require('./signin/create_signin_session')
})

/* API SSO */

api.add(endpoint.SSO, {
  get: require('./sso/render_form_sso')
})

/* API Sign out
step 1: GET form/signout
step 2: DELETE session
*/

api.add(endpoint.Form.Signout, {
  get: require('./signout/render_form_signout')
})

api.add(endpoint.Session, {
  delete: require('./signout/delete_signin_session')
})

/* API Reset password
step 1: POST link/resetpassword
step 2: GET form/account/newpassword
step 3: PUT account/password
*/

api.add(endpoint.Link.ResetPassword, {
  post: require('./resetpassword/create_link_resetpassword')
})

api.add(endpoint.Form.NewPassword, {
  get: require('./resetpassword/render_form_newpassword')
})

api.add(endpoint.Account.Password, {
  put: require('./resetpassword/reset_password')
})

/* API Change password
step 1: Get form/account/changepassword
step 2: PUT me/password
*/

api.add(endpoint.Form.ChangePassword, {
  get: require('./changepassword/render_form_changepassword')
})

api.add(endpoint.User.Password, {
  put: require('./changepassword/change_password')
})

module.exports = api
