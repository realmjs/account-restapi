"use strict"

const jwt = require('jsonwebtoken');

function validateParams() {
  return function(req, res, next) {
    if (req.body && req.body.app && req.body.token && req.body.profile) {
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
      res.locals.app = app;
      next();
    } else {
      res.status(400).json({ error: 'Bad Request'});
    }
  }
}

function authen() {
  return function(req, res, next) {
    const app = res.locals.app;
    const token = req.body.token;
    jwt.verify(token, app.key, (err, decoded) => {
      if (err) {
        res.status(401).json({ error: 'Unauthorized' });
      } else {
        res.locals.uid = decoded.uid;
        next();
      }
    })
  }
}

function update(helpers) {
  return function(req, res) {
    const profile = req.body.profile;
    helpers.Database.USER.profile.update({ uid: res.locals.uid }, profile)
    .then( update => {
      res.status(200).json({ update });
    })
    .catch(err => {
      helpers.alert && helpers.alert(`PUT /me/profile: Error in update: ${err}`);
      res.status(403).json({ error: 'Forbidden' });
    });
  }
}

module.exports = [validateParams, verifyApp, authen, update];
