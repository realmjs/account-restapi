"use strict"

const { decodeCookie, cleanCookieMiddleware } = require('../../lib/util');

function validateParams(helpers) {
  return function(req, res, next) {
    if (!req.body.app || !req.body.sid) {
      res.status(400).json({ error: 'Bad Request'});
      return;
    }
    const app = helpers.Apps.find( app => app.id === req.body.app );
    if (app) {
      res.locals.app = app;
      next();
    } else {
      res.status(400).json({ error: 'Bad Request' });
    }
  }
}

function getSession() {
  return function(req, res, next) {
    const cookies = req.cookies;
    const app = res.locals.app;
    decodeCookie(cookies, app)
    .then( session => {
      if (session && session.sessionId === req.body.sid) {
        next();
      } else {
        res.status(403).json({ error: 'Forbidden' });
      }
    })
    .catch( err => {
      res.status(403).json({ error: 'Forbidden' });
    });
  }
}

function done() {
  return function(req, res) {
    res.status(200).json({ message: 'Success' });
  }
}

module.exports = [validateParams, getSession, cleanCookieMiddleware, done]
