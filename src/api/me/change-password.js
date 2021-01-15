"use strict"

const { hashPassword } = require('../../lib/util')

const { checkPassword } = require('.././../lib/util')

function validateParameters() {
  return function(req, res, next) {
    if (req.body && req.body.app && req.body.username && req.body.password && req.body.password.length > 0 &&
        req.body.newPassword && req.body.newPassword.length > 0) {
      next();
    } else {
      res.status(400).json({ error: 'Bad Request'});
    }
  }
}

function verifyApp(helpers) {
  return function(req, res, next) {
    const app = helpers.Apps.find( app => app.id === req.body.app );
    if (app) {
      req.app = app;
      next();
    } else {
      res.status(400).json({ error: 'Bad Request'});
    }
  }
}

function findUser(helpers) {
  return function(req, res, next) {
    helpers.Database.LOGIN.find({ username: `= ${req.body.username}`})
    .then( users => {
      if (users && users.length > 0 && users[0].realms && users[0].realms[req.app.realm]) {
        req.user = users[0];
        next();
      } else {
        res.status(403).json({ error: 'Forbidden' }); // for security, return 403 instead of 404
      }
    })
    .catch( err => {
      helpers.alert && helpers.alert(`PUT /me/password: Error in findUser: ${err}`);
      res.status(403).json({ error: 'Forbidden' });
    });
  }
}

function verifyPassword() {
  return function(req, res, next) {
    if (checkPassword(req.user, req.body.password)) {
      next();
    } else {
      res.status(403).json({ error: 'Forbidden' });
    }
  }
}


function updatePassword(helpers) {
  return function(req, res) {
    helpers.Database.USER.update({ uid: req.user.uid }, { credentials: { password: hashPassword(req.body.newPassword) } })
    .then( _ => res.status(200).json({ message: 'Success' }) )
    .catch( err => {
      helpers.alert && helpers.alert(`PUT /me/password: Error in updatePassword: ${err}`);
      res.status(403).json({ error: 'Forbidden' });
    });
  }
}

module.exports = [validateParameters, verifyApp, findUser, verifyPassword, updatePassword];
