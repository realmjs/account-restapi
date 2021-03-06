"use strict"

const jwt = require('jsonwebtoken');

const html = require('../../lib/html');

function validateParams() {
  return function(req, res, next) {
    if (req.query && req.query.app && req.query.name) {
      next();
    } else {
      _renderError(req, res, 400, 'Bad Request');
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
      _renderError(req, res, 400, 'Bad Request');
    }
  }
}

function validateIfSignOutForm() {
  return function(req, res, next) {
    if (req.query.name === 'signout' && !req.query.sid) {
      _renderError(req, res, 400, 'Bad Request');
      return;
    }
    next();
  }
}

function validateTokenIfRequired() {
  return function(req, res, next) {
    if (req.query.name === 'reset' && verifyRequestToken(req) === false) {
      _renderError(req, res, 400, 'Bad Request');
      return;
    }
    next();
  }
}

function responseForm() {
  return function(req, res) {
    _renderForm(req, res, req.query.name, req.query.title || 'Form', res.locals.app, req.query);
  }
}

function verifyRequestToken(req) {
  if (!req.query.t) {  return false; }
  try { jwt.verify(req.query.t, process.env.EMAIL_SIGN_KEY); } catch (err) {  return false; }
  return true;
}

function _renderForm(req, res, name, title, app, query) {
  const data = { route: name, targetOrigin: app.url, app: app.id, query };
  if (req.query && req.query.height) { data.height= req.query.height }
  if (req.query && req.query.width) { data.width= req.query.width }
  res.writeHead( 200, { "Content-Type": "text/html" } );
  res.end(html({title, data, script: process.env.SCRIPT}));
}

function _renderError(req, res, code, detail) {
  const data = { route: 'error', targetOrigin: res.locals.app && res.locals.app.url, error: {code, detail} };
  res.writeHead( 200, { "Content-Type": "text/html" } );
  res.end(html({title: `Error ${code}`, data, script: process.env.SCRIPT}));
}

module.exports = [validateParams, verifyApp, validateIfSignOutForm, validateTokenIfRequired, responseForm];
