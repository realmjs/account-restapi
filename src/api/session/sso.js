"use strict"

const { generateAuthenTokenMiddleware, serializeUser, decodeCookie } = require('../../lib/util');
const html = require('../../lib/html');

function _sendErrorHTML(res, code, detail) {
  const data = { route: 'error', error: { code, detail } };
  res.writeHead( 200, { "Content-Type": "text/html" } );
  res.end(html({title: `Error ${400}`, data, script: process.env.SCRIPT, style: false}));
}

function _responseError(responseType, res, code, detail ) {
  if (responseType === 'json') {
    res.status(code).json({ error: detail });
  } else {
    _sendErrorHTML(res, code, detail);
  }
}

function validateParameters(helpers) {
  return function(req, res, next) {

    if (!req.query || req.query.length === 0) {
      _responseError('html', res, 400, 'Bad Request');
      return;
    }

    if (!req.query.app || req.query.app.length === 0) {
      _responseError(req.query.r, res, 400, 'Bad Request');
      return
    }

    const app = helpers.Apps.find( app => app.id === req.query.app );
    if (!app) {
      _responseError(req.query.r, res, 400, 'Bad Request');
      return;
    }

    req.app = app;
    next();

  }
}

function getSession() {
  return function(req, res, next) {
    const cookies = req.cookies;
    const app = req.app;
    decodeCookie(cookies, app)
    .then( session => { req.uid = session.uid; next(); })
    .catch( err => {
      if (err === 'no_cookie') {
        if (req.query && req.query.r && req.query.r === 'json') {
          res.status(200).json({session: null});
        } else {
          const data = { route: 'sso', targetOrigin: app.url, status: 200, session: null };
          res.writeHead( 200, { "Content-Type": "text/html" } );
          res.end(html({title: 'SSO', data, script: process.env.SCRIPT, style: false}));
        }
      } else {
        if (req.query && req.query.r && req.query.r === 'json') {
          res.status(400).json({ error: 'Bad request' });
        } else {
          const data = { route: 'error', targetOrigin: app.url, error: {code: 400, detail: 'Bad request'} };
          res.writeHead( 200, { "Content-Type": "text/html" } );
          res.end(html({title: 'Error', data, script: process.env.SCRIPT, style: false}));
        }
      }
    });
  }
}

function findUser(helpers) {
  return function(req, res, next) {
    const app = req.app;
    helpers.Database.USERS.find({ uid: `= ${req.uid}`})
    .then( users => {
      if (users && users.length > 0 && users[0].realms && users[0].realms[app.realm]) {
        req.user = users[0];
        next();
      } else {
        if (req.query && req.query.r && req.query.r === 'json') {
          res.status(404).json({ error: 'No user' });
        } else {
          const data = { route: 'error', targetOrigin: app.url, error: {code: 404, detail: 'No user'} };
          res.writeHead( 200, { "Content-Type": "text/html" } );
          res.end(html({title: 'Error', data, script: process.env.SCRIPT, style: false}));
        }
      }
    })
    .catch( err => {
      helpers.alert && helpers.alert(err)
      if (req.query && req.query.r && req.query.r === 'json') {
        res.status(403).json({ error: 'Unable to access Database' });
      } else {
        const data = { route: 'error', targetOrigin: app.url, error: {code: 403, detail: 'Unable to access Database'} };
        res.writeHead( 200, { "Content-Type": "text/html" } );
        res.end(html({title: 'Error', data, script: process.env.SCRIPT, style: false}));
      }
    });
  }
}

function responseSuccess() {
  return function(req, res) {
    if (req.query && req.query.r && req.query.r === 'json') {
      res.status(200).json({session: { user: serializeUser(req.user), token: req.authenToken }});
    } else {
      const app = req.app;
      const data = { route: 'sso', targetOrigin: app.url, status: 200, session: { user: serializeUser(req.user), token: req.authenToken } };
      res.writeHead( 200, { "Content-Type": "text/html" } );
      res.end(html({title: 'SSO', data, script: process.env.SCRIPT, style: false}));
    }
  }
}

module.exports = [validateParameters, getSession, findUser, generateAuthenTokenMiddleware, responseSuccess]
