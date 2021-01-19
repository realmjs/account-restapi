"use strict"

const jwt = require('jsonwebtoken');

const html = require('../../lib/html');

function validateParams() {
  return function(req, res, next) {
    if (req.query && req.query.app && req.query.name) {
      next();
    } else {
      res.redirect('/error/400');
    }
  }
}

function verifyApp(helpers) {
  return function(req, res, next) {
    const app = helpers.Apps.find( app => app.id === req.query.app );
    if (app) {
      req.app = app;
      next();
    } else {
      res.redirect('/error/400');
    }
  }
}

function validateTokenIfRequired() {
  return function(req, res, next) {
    if (req.query.name === 'resetpassword' && verifyRequestToken(req) === false) {
      res.redirect('/error/400');
    }
    next();
  }
}

function responseForm() {
  return function(req, res) {
    _renderForm(req, res, req.query.name, req.query.title || 'Form', req.app, req.query);
  }
}

function verifyRequestToken(req) {
  if (!req.query.t) {  return false; }
  try { jwt.verify(req.query.t, process.env.EMAIL_SIGN_KEY); } catch (err) {  return false; }
  return true;
}

function _renderForm(req, res, name, title, app, query) {
  const data = { route: name, targetOrigin: app.url, app: app.id, query }
  if (req.query && req.query.height) { data.height= req.query.height }
  if (req.query && req.query.width) { data.width= req.query.width }
  res.writeHead( 200, { "Content-Type": "text/html" } );
  res.end(html({title, data, script: process.env.SCRIPT}));
}

module.exports = [validateParams, verifyApp, validateTokenIfRequired, responseForm];
