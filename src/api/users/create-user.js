"use strict"

const uuid = require('uuid/v1')
const jwt = require('jsonwebtoken')

const { hashPassword, generateAuthenTokenMiddleware, setHttpCookieMiddleware, serializeUser } = require('../../lib/util')

function validateParameters() {
  return function(req, res, next) {
    const user = req.body.user
    if (!user || !user.email) {
      res.status(400).send({ error: 'Bad request'})
      return
    }
    next()
  }
}

function checkUserExistance(helpers) {
  return function(req, res, next) {
    const user = req.body.user
    helpers.Database.LOGIN.find({ username: `= ${user.email}`})
    .then( users => {
      if (users && users.length > 0) {
        res.status(403).send({ error: 'email is already used' })
      } else {
        next()
      }
    })
    .catch( err => res.status(403).json({ error: '[1] Unable to access Database' }))
  }
}

function createUser(helpers) {
  return function(req, res, next) {
    const profile = { ...req.body.user.profile }
    // mark empty field as N/A if any
    for (let prop in profile) {
      if (typeof profile[prop] === 'string' && profile[prop].length === 0) {
        profile[prop]  = 'N/A'
      }
    }
    // set default picture
    if (profile.gender && profile.gender === 'female') {
      profile.picture = process.env.DEFAULT_FEMALE_PICTURE
    } else {
      profile.picture = process.env.DEFAULT_MALE_PICTURE
    }
    const user = {
      username: req.body.user.email.toLowerCase().trim(),
      uid: uuid(),
      credentials: { password: hashPassword(req.body.user.password) },
      profile,
      verified: false,
      createdAt: (new Date()).getTime()
    }
    helpers.Database.USERS.insert(user)
    .then( user => { req.user = user; next(); })
    .catch( err => res.status(403).json({ error: '[2] Unable to access Database' }))
  }
}

function sendEmail(helpers) {
  return function(req, res, next) {
    if (helpers.sendEmail) {
      /* generate token to active email */
      const user = req.user
      const account = helpers.Apps.find(app => app.id === 'account')
      if (account) {
        const token = jwt.sign(
          {uid: user.uid},
          process.env.EMAIL_SIGN_KEY,
          { expiresIn: process.env.EXPIRE_RESET_LINK }
        )
        helpers.sendEmail({
          recipient: [{ email: user.profile.email[0], name: user.profile.displayName }],
          template: 'verifyemail',
          data: { customer: user.profile.displayName, endpoint:`${account.url}/ln/verify`, email: user.profile.email[0], token }
        }).catch(err => helpers.alert && helpers.alert(`User ${user.profile.displayName}[${user.profile.email[0]}] is created. But failed to send verification email`))
      } else {
        helpers.alert && helpers.alert('Cannot find account in environment variable APPS')
      }
    }
    next()
  }
}

function responseSuccess() {
  return function(req, res) {
    res.status(200).json({ user: serializeUser(req.user), token: req.authenToken })
  }
}

module.exports = [validateParameters, checkUserExistance, createUser, generateAuthenTokenMiddleware, setHttpCookieMiddleware, sendEmail, responseSuccess]
