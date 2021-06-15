"use strict"

const jwt = require('jsonwebtoken');

const { isEmail } = require('../../lib/form');

function validateParameters() {
  return function(req, res, next) {
    if (req.query.app && req.query.u) {
      next();
    } else {
      res.status(400).json({ error: 'Bad Request' });
      return;
    }
  }
}

function verifyApp(helpers) {
  return function(req, res, next) {
    const app = helpers.Apps.find( app => app.id === req.query.app );
    if (app) {
      res.locals.app = app;
      next();
    } else {
      res.status(400).json({ error: 'Bad Request' });
    }
  }
}
function findUser(helpers) {
  return function (req, res) {
    if (isEmail(req.query.u)) {
      findUserByEmail(req, res, helpers);
    } else {
      findUserByToken(req, res, helpers);
    }
  }
}


/*
  Public API return user email
  Its usecase is for testing whether email is registered
*/
function findUserByEmail(req, res, helpers) {
  const email = req.query.u;
  helpers.Database.LOGIN.find({ username: email })
  .then( user => {
    if (user) {
      res.status(200).json({ username: email });
    } else {
      res.status(404).json({ error: 'Not Found' });
    }
  })
  .catch( err => {
    helpers.alert && helpers.alert(`GET /user: Error in findUserByEmail: ${err}`);
    res.status(403).json({ error: 'Forbidden' });
  });
}


/*
  Authentication requred API, return username and profile
  It's usecase is for a server application request user information
*/
function findUserByToken(req, res, helpers) {
  const token = req.query.u;
  const app = res.locals.app;
  jwt.verify(token, app.key, (err, decoded) => {
    if (err) {
      res.status(401).json({ error: 'Unauthorized' });
      return
    }
    helpers.Database.USER.find({ uid: decoded.uid })
    .then( user => {
      if (user) {
        res.status(200).json({ username: user.username, profile: user.profile });
      } else {
        res.status(404).json({ error: 'Not Found' });
      }
    })
    .catch( err => {
      helpers.alert && helpers.alert(`GET /user: Error in findUserByToken: ${err}`);
      res.status(403).json({ error: 'Forbidden' });
    });
  });
}

module.exports = [validateParameters, verifyApp, findUser];
