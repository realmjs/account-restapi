'use strict'

const uuid = require('uuid/v1');
const { isEmail, alertCrashedEvent, hashPassword, ustring, createCookie, maskUser, createSessionToken } = require('../../lib/util')
const middlewareFactory = require('../../lib/middleware_factory')

const validateRequest = () => (req, res, next) => {
  if (req.body.email && isEmail(req.body.email) &&
      req.body.password &&
      req.body.profile && req.body.profile.fullName &&
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

const createUID = (helpers) => (req, res, next) => {
  generateUID()
  function generateUID() {
    const uid = uuid()
    helpers.Database.Account.find({ uid })
    .then(user => {
      if (user) {
        generateUID()
      } else {
        res.locals.uid = uid
        next()
      }
    })
    .catch( err =>
      helpers.alert && alertCrashedEvent(helpers.alert, 'create_newaccount.js', 'createUID', err)
    )
  }
}

const createUser = (helpers) => (req, res, next) => {
  const profile = { ...req.body.profile }
  const salty = { head: ustring(8), tail: ustring(8) };
  const user = {
    email: req.body.email.toLowerCase().trim(),
    uid: res.locals.uid,
    salty,
    credentials: { password: hashPassword(req.body.password, salty) },
    profile,
    createdAt: (new Date()).getTime(),
    realms: { [res.locals.app.realm] : { roles: ['member'] } },
  }
  res.locals.user = user

  helpers.Database.Account.insert(user)
  .then(user => next())
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
    to: { address: user.email, name: user.profile.fullName },
    template: 'welcome_new_user'
  })
  .then(() => next())
}


const onCreatedUserCallback = (helpers) => (req, res, next) => {
  const user = res.locals.user
  helpers.hook && helpers.hook.onCreatedUser && helpers.hook.onCreatedUser({
    uid: user.uid,
    email: user.email,
    profile: user.profile,
    createdAt: user.createdAt,
    realms: user.realms,
  })
  .then(() => next())
}

const final = () => (req, res) => res.status(200).json({
  user: maskUser(res.locals.user),
  token: createSessionToken(res.locals.user, res.locals.app),
  sid: res.locals.sessionId
})

module.exports = [
  validateRequest,
  validateAppThenStoreToLocals,
  checkEmailExistence,
  createUID,
  createUser,
  setCookie,
  sendEmail,
  onCreatedUserCallback,
  final
]
