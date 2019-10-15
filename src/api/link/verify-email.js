/*
  API: GET /ln/verify?email=email&t=t
*/
"use strict"

const jwt = require('jsonwebtoken')

function validateParams() {
  return function(req, res, next) {
    if (req.query && req.query.email && req.query.t) {
      next()
    } else {
      res.redirect('/error/400')
    }
  }
}

function decodeToken() {
  return function(req, res, next) {
    jwt.verify(req.query.t, process.env.EMAIL_SIGN_KEY, (err, decoded) => {
      if (err) {
        res.redirect('/error/404')
      } else {
        req.uid = decoded.uid
        next()
      }
    })
  }
}

function checkVerifiedEmail(helpers) {
  return function(req, res, next) {
    helpers.Database.USERS.find({ uid: `= ${req.uid}` })
    .then( users => {
      if (users && users.length > 0) {
        const user = users[0]
        if (user.username !== req.query.email) { res.redirect('/error/403'); return }
        if (user.verified) { res.redirect('/ln/mailverified'); return }
        next()
      } else {
        res.redirect('/error/404')
      }
    })
    .catch( err => {
      helpers.alert && helpers.alert(err)
      res.redirect('/error/500')
    })
  }
}

function setEmailVerified(helpers) {
  return function(req, res, next) {
    helpers.Database.USERS.update({ uid: req.uid }, { verified: true })
    .then( _ => res.redirect('/ln/mailverified') )
    .catch( err => {
      helpers.alert && helpers.alert(err)
      res.redirect('/error/500')
    })
  }
}

module.exports = [validateParams, decodeToken, checkVerifiedEmail, setEmailVerified]
