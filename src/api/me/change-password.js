"use strict"

const { hashPassword } = require('../../lib/util')

const { checkPassword } = require('.././../lib/util')

function validateParameters() {
  return function(req, res, next) {
    if (!(req.body &&
          req.body.app &&
          req.body.username &&
          req.body.password && req.body.password.length > 0 &&
          req.body.newPassword && req.body.newPassword.length > 0)) {
      res.status(400).send({ error: 'Bad request'});
    } else {
      next();
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
      res.status(404).send({ error: 'App Not found'});
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
        res.status(404).send({ error: 'User is not exist' });
      }
    })
    .catch( err => res.status(403).json({ error: '[1] Unable to access Database' }));
  }
}

function verifyPassword() {
  return function(req, res, next) {
    if (checkPassword(req.user, req.body.password)) {
      next();
    } else {
      res.status(401).send({ error: 'Invalid credential' });
    }
  }
}


function updatePassword(helpers) {
  return function(req, res, next) {
    helpers.Database.USERS.update({ uid: req.user.uid }, { credentials: { password: hashPassword(req.body.newPassword) } })
    .then( _ => res.status(200).send('Success') )
    .catch( err => {
      helpers.alert && helpers.alert(err);
      res.status(500).send('Internal Error');
    });
  }
}

module.exports = [validateParameters, verifyApp, findUser, verifyPassword, updatePassword];
