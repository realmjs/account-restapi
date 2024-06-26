"use strict"

const middlewareFactory = require('../../lib/middleware_factory')
const { isEmail, alertCrashedEvent, matchUserPassword, createCookie, maskUser, createSessionToken, verifyRealm, ustring } = require('../../lib/util')

const validateRequest = () => (req, res, next) => {
  if (req.body.email && isEmail(req.body.email) && req.body.password && req.body.app) {
    next()
  } else {
    res.status(400).send('Bad Request')
  }
}

const validateAppThenStoreToLocals = middlewareFactory.create(
  'validateAppThenStoreToLocals',
  'byRequestBody',
  'create_signin_session.js'
)

const getUserAccountByEmail = (helpers) => (req, res, next) => {
  helpers.Database.Account.find({ email: req.body.email })
  .then( user => {
    if (user && verifyRealm(res.locals.app, user)) {
      res.locals.user = user
      next()
    } else {
      res.status(401).send('Unauthenticated')
    }
  })
  .catch( err =>
    helpers.alert && alertCrashedEvent(helpers.alert, 'create_signin_session.js', 'getUserAccountByEmail', err)
  )
}

const checkPassword = () => (req, res, next) => {
  if (matchUserPassword(res.locals.user, req.body.password)) {
    next()
  } else {
    res.status(401).send('Unauthenticated')
  }
}

const setCookie = () => (req, res, next) => {
  const cookie = createCookie(res.locals.user.uid, res.locals.app.realm)
  res.locals.sessionId = JSON.parse(cookie[1]).sessionId
  res.cookie(...cookie)
  next()
}

const writeToLoginSessionTable = (helpers) => async (req, res, next) => {
  try {
    await helpers.Database.LoginSession.remove({ uid: res.locals.user.uid });
    const session = {
      uid: res.locals.user.uid,
      sid: res.locals.sessionId,
      skey: ustring(16),
      user_agent: req.useragent,
      created_at: new Date()
    };
    await helpers.Database.LoginSession.insert(session);
    next();
  } catch( err ) {
    helpers.alert && alertCrashedEvent(helpers.alert, 'create_signin_session.js', 'writeToLoginSessionTable', err)
  }
}

const final = () => (req, res) => res.status(200).json({
  user: maskUser(res.locals.user),
  token: createSessionToken(res.locals.user.uid, res.locals.sessionId, res.locals.app.key),
})

module.exports = [
  validateRequest,
  validateAppThenStoreToLocals,
  getUserAccountByEmail,
  checkPassword,
  setCookie,
  writeToLoginSessionTable,
  final
]
