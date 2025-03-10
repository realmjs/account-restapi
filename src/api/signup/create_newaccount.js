'use strict'

const { isEmail, alertCrashedEvent, hashPassword, ustring, createCookie, maskUser, createSessionToken } = require('../../lib/util')
const middlewareFactory = require('../../lib/middleware_factory')

const validateRequest = () => (req, res, next) => {
  if (req.body.email && isEmail(req.body.email) &&
      req.body.password &&
      req.body.profile && req.body.profile.fullname &&
      req.body.app
  ) {
    next()
  } else {
    res.status(400).send('Bad Request')
  }
}


const validateAppThenStoreToLocals = middlewareFactory.create(
  'validateAppThenStoreToLocals',
  'byRequestBody',
  'create_link_newaccount.js'
)

const checkEmailExistence = (helpers) => (req, res, next) => {
  helpers.Database.Account.find({ email: req.body.email })
  .then( user => {
    if (user) {
      res.status(409).send('Email is registered')
    } else {
      next()
    }
  })
  .catch( err =>
    helpers.alert && alertCrashedEvent(helpers.alert, 'create_newaccount.js', 'checkEmailExistence', err)
  )
}

const createUser = (helpers) => (req, res, next) => {
  const profile = { ...req.body.profile };
  const salty = { head: ustring(8), tail: ustring(8) };
  const user = {
    email: req.body.email.toLowerCase().trim(),
    salty,
    credentials: { password: hashPassword(req.body.password, salty) },
    profile,
    created_at: new Date(),
    realms: { [res.locals.app.realm] : { roles: ['member'] } },
  }
  helpers.Database.Account.insert(user)
  .then(user => {
    res.locals.user = user
    next()
  })
  .catch( err =>
    helpers.alert && alertCrashedEvent(helpers.alert, 'create_newaccount.js', 'createUser', err)
  )
}

const setCookie = () => (req, res, next) => {
  const cookie = createCookie(res.locals.user.uid, res.locals.app.realm)
  res.locals.sessionId = JSON.parse(cookie[1]).sessionId
  res.cookie(...cookie)
  next()
}

const sendEmail = (helpers) => (req, res, next) => {
  const user = res.locals.user
  helpers.hook.sendEmail({
    to: { address: user.email, name: user.profile.fullname },
    template: 'WelcomeNewUserEmail',
  })
  .then(() => next())
  .catch((err) => {
    helpers.alert && alertCrashedEvent(helpers.alert, 'create_newaccount.js', 'sendEmail', err);
    next();
  })
}


const onCreatedUserCallback = (helpers) => (req, res, next) => {
  const user = res.locals.user
  helpers.hook && helpers.hook.onCreatedUser && helpers.hook.onCreatedUser({
    uid: user.uid,
    email: user.email,
    profile: user.profile,
    created_at: user.created_at,
    realms: user.realms,
  })
  .then(() => next())
}


const writeToLoginSessionTable = (helpers) => async (req, res, next) => {
  try {
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
    helpers.alert && alertCrashedEvent(helpers.alert, 'create_newaccount.js', 'writeToLoginSessionTable', err)
  }
}

const final = () => (req, res) => res.status(200).json({
  user: maskUser(res.locals.user),
  token: createSessionToken(res.locals.user.uid, res.locals.sessionId, res.locals.app.key),
})

module.exports = [
  validateRequest,
  validateAppThenStoreToLocals,
  checkEmailExistence,
  createUser,
  setCookie,
  sendEmail,
  onCreatedUserCallback,
  writeToLoginSessionTable,
  final
]
