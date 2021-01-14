"use strict"

const jwt = require('jsonwebtoken')

const { hashPassword } = require('../../lib/util')

function validateParams() {
  return function(req, res, next) {
    if (req.body && req.body.password && req.body.t) {
      next();
    } else {
      res.status(400).send('Bad request');
    }
  }
}

function decodeToken() {
  return function(req, res, next) {
    jwt.verify(req.body.t, process.env.EMAIL_SIGN_KEY, (err, decoded) => {
      if (err) {
        res.status(404).send('Resouce not found');
      } else {
        req.uid = decoded.uid;
        next();
      }
    })
  }
}

function updatePassword(helpers) {
  return function(req, res, next) {
    helpers.Database.USERS.update({ uid: req.uid }, { credentials: { password: hashPassword(req.body.password) } })
    .then( _ => res.status(200).send('Success') )
    .catch( err => {
      helpers.alert && helpers.alert(err);
      res.status(500).send('Internal Error');
    });
  }
}

module.exports = [validateParams, decodeToken, updatePassword];
