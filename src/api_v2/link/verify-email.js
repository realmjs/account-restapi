/*
  API: GET /ln/verify?email=email&t=t
*/
"use strict"

const jwt = require('jsonwebtoken');

function validateParams() {
  return function(req, res, next) {
    if (req.query && req.query.email && req.query.t) {
      next();
    } else {
      res.redirect('/error/400');
    }
  }
}

function decodeToken() {
  return function(req, res, next) {
    jwt.verify(req.query.t, process.env.EMAIL_SIGN_KEY, (err, decoded) => {
      if (err) {
        res.redirect('/error/403');
      } else {
        res.locals.uid = decoded.uid;
        next();
      }
    })
  }
}

function checkVerifiedEmail(helpers) {
  return function(req, res, next) {
    helpers.Database.USER.find({ uid: res.locals.uid })
    .then( user => {
      if (user) {
        if (user.username !== req.query.email) { res.redirect('/error/403'); return }
        if (user.verify) { res.redirect(`/ln/mailverified?t=${req.query.t}`); return }
        next();
      } else {
        res.redirect('/error/403');
      }
    })
    .catch( err => {
      helpers.alert && helpers.alert(`GET /ln/email: Error in checkVerifiedEmail: ${err}`);
      res.redirect('/error/403');
    });
  }
}

function setEmailVerified(helpers) {
  return function(req, res, next) {
    helpers.Database.USER.verified.update({ uid: res.locals.uid }, true)
    .then( _ => res.redirect(`/ln/mailverified?t=${req.query.t}`) )
    .catch( err => {
      helpers.alert && helpers.alert(`GET /ln/email: Error in setEmailVerified: ${err}`);
      res.redirect('/error/403');
    });
  }
}

module.exports = [validateParams, decodeToken, checkVerifiedEmail, setEmailVerified];
