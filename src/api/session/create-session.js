"use strict"

const { checkPassword, generateAuthenTokenMiddleware, setHttpCookieMiddleware, serializeUser } = require('../../lib/util');

function validateParameters() {
  return function(req, res, next) {
    if (req.body.username && req.body.password && req.body.password.length > 0 && req.body.app) {
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
      res.locals.app = app;
      next();
    } else {
      res.status(400).json({ error: 'Bad Request'});
    }
  }
}

function findUser(helpers) {
  return function(req, res, next) {
    helpers.Database.LOGIN.find({ username: req.body.username })
    .then( user => {
      if (user && user.realms && user.realms[res.locals.app.realm]) {
        res.locals.user = user;
        next();
      } else {
        res.status(404).send({ error: 'Not Found' });
      }
    })
    .catch( err => {
      helpers.alert && helpers.alert(`POST /session: Error in findUser: ${err}`);
      res.status(403).json({ error: 'Access Denied' });
    });
  }
}

function verifyPassword() {
  return function(req, res, next) {
    if (checkPassword(res.locals.user, req.body.password)) {
      next();
    } else {
      res.status(401).send({ error: 'Unauthorized' });
    }
  }
}

function responseSuccess() {
  return function(req, res) {
    const session = { user: serializeUser(res.locals.user), token: res.locals.authenToken, sid: res.locals.sid };
    res.status(200).json({ session });
  }
}

module.exports = [validateParameters, verifyApp, findUser, verifyPassword, generateAuthenTokenMiddleware, setHttpCookieMiddleware, responseSuccess]
