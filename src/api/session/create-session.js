"use strict"

const { checkPassword, generateAuthenTokenMiddleware, setHttpCookieMiddleware, serializeUser } = require('../../lib/util');

function validateParameters() {
  return function(req, res, next) {
    if (req.body.username && req.body.password && req.body.app) {
      next();
    } else {
      res.status(400).json({ error: 'Bad request'});
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
      res.status(404).json({ error: 'Not found'});
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

function responseSuccess() {
  return function(req, res) {
    res.status(200).json({ user: serializeUser(req.user), token: req.authenToken });
  }
}

module.exports = [validateParameters, verifyApp, findUser, verifyPassword, generateAuthenTokenMiddleware, setHttpCookieMiddleware, responseSuccess]
