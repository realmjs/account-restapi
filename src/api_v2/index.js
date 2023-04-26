"use strict"

const Builder = require('express-api-builder');

const api = Builder();

api.use(require('cookie-parser')());

/* forms */
api.add('/form', {
  get: require('./form/render-form')
});

/* user */
api.add('/user', {
  get: require('./user/find-users'),
  post: require('./user/create-user')
});
api.add('/user/password', {
  put: require('./user/change-password')
});

/* session */
api.add('/session', {
  get: require('./session/sso'),
  post: require('./session/create-session'),
  delete: require('./session/delete-session'),
});

/* link */
api
.add('/ln/verify', {
  get: require('./link/verify-email')
})
.add('/ln/mailverified', {
  get: require('./link/mail-verified')
})
.add('/ln/reset', {
  post: require('./link/create-reset-link')
})

/* error */
api.add('/error/:code', {
  get: require('./error/render-error-page')
});

/* me */
api.add('/me/password', {
  put: require('./me/change-password'),
});
api.add('/me/profile', {
  put: require('./me/update-profile')
});

module.exports = api;
