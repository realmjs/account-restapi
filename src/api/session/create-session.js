"use strict"

const { checkPassword, generateAuthenTokenMiddleware, setHttpCookieMiddleware, serializeUser } = require('../../lib/util')

function validateParameters() {
  return function(req, res, next) {
    if (req.body.username && req.body.password) {
      next()
    } else {
      res.status(400).send({ error: 'Bad request'})
    }
  }
}

function findUser(helpers) {
  return function(req, res, next) {
    helpers.Database.USERS.find({ username: `= ${req.body.username}`})
    .then( users => {
      if (users && users.length > 0) {
        req.user = users[0]
      } else {
        res.status(404).send({ error: 'User is not exist' })
      }
    })
    .catch( err => res.status(403).json({ error: '[1] Unable to access Database' }))
  }
}

function verifyPassword() {
  return function(req, res, next) {
    if (checkPassword(req.user, req.body.password)) {
      next()
    } else {
      res.status(401).send({ error: 'Invalid credential' })
    }
  }
}

function responseSuccess() {
  return function(req, res) {
    res.status(200).json({ user: serializeUser(req.user), token: req.authenToken })
  }
}

module.exports = [validateParameters, findUser, verifyPassword, generateAuthenTokenMiddleware, setHttpCookieMiddleware, responseSuccess]
