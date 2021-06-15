"use strict"

const jwt = require('jsonwebtoken')

const { hashPassword } = require('../../lib/util')

function validateParams() {
  return function(req, res, next) {
    if (req.body && req.body.password && req.body.t) {
      next();
    } else {
      res.status(400).json({ error: 'Bad Request' });
    }
  }
}

function decodeToken() {
  return function(req, res, next) {
    jwt.verify(req.body.t, process.env.EMAIL_SIGN_KEY, (err, decoded) => {
      if (err) {
        res.status(403).json({ error: 'Forbidden' });
      } else {
        res.locals.uid = decoded.uid;
        next();
      }
    })
  }
}

function updatePassword(helpers) {
  return function(req, res, next) {
    helpers.Database.USER.password.update({ uid: res.locals.uid }, hashPassword(req.body.password))
    .then( _ => res.status(200).json({ message: 'Success' }) )
    .catch( err => {
      helpers.alert && helpers.alert(`PUT /user/password: Error in updatePassword: ${err}`);
      res.status(403).json({ error: 'Forbidden' });
    });
  }
}

module.exports = [validateParams, decodeToken, updatePassword];
