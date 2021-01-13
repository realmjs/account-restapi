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
      req.app = app;
      next();
    } else {
      res.status(400).json({ error: 'Bad Request' });
    }
  }
}

function getSession() {
  return function(req, res, next) {
    const cookies = req.cookies;
    const app = req.app;
    decodeCookie(cookies, app)
    .then( session => {
      if (session && session.sessionId === req.body.sid) {
        next();
      } else {
        res.status(403).json({ error: 'Access Denied' });
      }
    })
    .catch( err => {
      res.status(403).json({ error: 'Access Denied' });
    });
  }
}

function done() {
  return function(req, res) {
    res.status(200).json({ message: 'Success' });
  }
}

module.exports = [validateParams, getSession, cleanCookieMiddleware, done]
