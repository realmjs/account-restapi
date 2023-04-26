"use strict"

const { generateAuthenTokenMiddleware, serializeUser, decodeCookie } = require('../../lib/util');
const html = require('../../lib/html');

function _sendErrorHTML(res, code, detail, targetOrigin) {
  const data = { route: 'error', error: { code, detail }, targetOrigin };
  res.writeHead( 200, { "Content-Type": "text/html" } );
  res.end(html({title: `Error ${code}`, data, script: process.env.SCRIPT, style: false}));
}

function _responseError(responseType, res, code, detail, targetOrigin ) {
  if (responseType === 'json') {
    res.status(code).json({ error: detail });
  } else {
    _sendErrorHTML(res, code, detail, targetOrigin);
  }
}

function _sendSuccessHTML(res, statusCode, session, targetOrigin) {
  const data = { route: 'sso', targetOrigin, status: statusCode, session };
  res.writeHead( 200, { "Content-Type": "text/html" } );
  res.end(html({title: 'SSO', data, script: process.env.SCRIPT, style: false}));
}

function _responseSuccess(responseType, res, session, targetOrigin) {
  const statusCode = session? 200 : 404;
  if (responseType === 'json') {
    res.status(statusCode).json({ session });
  } else {
    _sendSuccessHTML(res, statusCode, session, targetOrigin);
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

    res.locals.app = app;
    next();

  }
}

function getSession(helpers) {
  return function(req, res, next) {
    const cookies = req.cookies;
    const app = res.locals.app;
    decodeCookie(cookies, app)
    .then( session => {
      if (session) {
        res.locals.uid = session.uid;
        res.locals.sid = session.sessionId;
        next();
      } else {
        _responseSuccess(req.query.r, res, null, app.url);
      }
    })
    .catch( err => {
      helpers.alert && helpers.alert(`GET /session: Error in getSession: ${err}`);
      _responseError(req.query.r, res, 403, 'Access Denie', app.url);
    });
  }
}

function findUser(helpers) {
  return function(req, res, next) {
    const app = res.locals.app;
    helpers.Database.USER.find({ uid: res.locals.uid })
    .then( user => {
      if (user && user.realms && user.realms[app.realm]) {
        res.locals.user = user;
        next();
      } else {
        _responseError(req.query.r, res, 404, 'Not Found');
      }
    })
    .catch( err => {
      helpers.alert && helpers.alert(`GET /session: Error in findUser: ${err}`);
      _responseError(req.query.r, res, 403, 'Access Denied');
    });
  }
}

function final() {
  return function(req, res) {
    const session = { user: serializeUser(res.locals.user), token: res.locals.authenToken, sid: res.locals.sid };
    const app = res.locals.app;
    _responseSuccess(req.query.r, res, session, app.url);
  }
}

module.exports = [validateParameters, getSession, findUser, generateAuthenTokenMiddleware, final];
