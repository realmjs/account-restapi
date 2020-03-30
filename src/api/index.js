"use strict"

const Builder = require('express-api-builder');

const api = Builder();

api.use(require('cookie-parser')());

/*
  Apps are defined in environment variable in the pair of id|url, seperated by one space
  ex: APPS="id|url id|url"
*/
api.helpers({
  Apps: process.env.APPS.split(' ').map( item => {
    const s = item.split('|');
    const app = s[0].trim();
    const url = s[1].trim();
    const { realm, key } = __findRealm(app);
    return { id: app, url, realm, key };
  })
});

function __findRealm(app) {
  const realms = __getRealms();
  for (let realm in realms) {
    if (realms[realm].apps.indexOf(app) !== -1) {
      return { realm, key: realms[realm].key };
    }
  }
  return { realm: undefined, key: undefined };
}

function __getRealms() {
  /*
  Realms are defined in environment variable in the pair of realm=[apps]|key, seperated by one space
  ex: REALMS="puclic=web,learn,exam|public-secret-key secure=admin|secure-secret-key"
  return realms = {
    public: {
      apps: [web, learn, exam],
      key: public-secret-key,
    },
    secure: {
      apps: [admin],
      key: secure-secret-key,
    },
  }
*/
  const realms = {};
  process.env.REALMS.split(' ').forEach(realm => {
    const s = realm.trim().split('|');
    // get realm name and app list
    const r = s[0].split('=');
    const name = r[0].trim();
    const apps = r[1].split(',').map(a => a.trim());
    const key = s[1].trim();
    realms[name] = { apps, key };
  });
  return realms;
}

/* forms */
api.add('/form', {
  get: require('./form/render-form')
});

/* users */
api.add('/users', {
  get: require('./users/find-users'),
  post: require('./users/create-user')
});
api.add('/users/password', {
  put: require('./users/change-password')
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
