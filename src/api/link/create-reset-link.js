"use strict"

const jwt = require('jsonwebtoken');

const html = require('../../lib/html');


function validateParams() {
  return function(req, res, next) {
    if (req.body && req.body.app && req.body.email) {
      next();
    } else {
      res.redirect('/error/400');
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
      res.redirect('/error/400');
    }
  }
}

function findUser(helpers) {
  return function(req, res, next) {
    helpers.Database.LOGIN.find({ username: req.body.email })
      .then( user => {
        if (user) {
          res.locals.user = user;
          next();
        } else {
          res.redirect('/error/403');
        }
      })
      .catch( err => {
        helpers.alert && helpers.alert(`POST /ln/reset: Error in findUser: ${err}`);
        res.redirect('/error/403');
      })
  }
}

function createToken(helpers) {
  return function(req, res, next) {
    try {
      res.locals.token = jwt.sign({ uid: res.locals.user.uid }, process.env.EMAIL_SIGN_KEY, { expiresIn: process.env.EMAIL_EXPIRE_RESET_LINK });
      next();
    } catch(err) {
      helpers.alert && helpers.alert(`POST /ln/reset: Error in createToken: ${err}`);
      res.redirect('/error/403');
    }
  }
}

function sendEmail(helpers) {
  return function(req, res, next) {
    const user = res.locals.user;
    const account = helpers.Apps.find(app => app.id === 'account');
    if (account) {
      try {
        helpers.sendEmail({
          recipient: [{ address: user.profile.email[0], name: user.profile.displayName }],
          template: 'resetemail',
          data: { customer: user.profile.displayName, endpoint:`${account.url}/form?name=reset&app=account`, token: res.locals.token }
        })
        .then(() => next())
        .catch(err => {
          helpers.alert && helpers.alert(`POST /ln/reset: Error in sendEmail to ${user.profile.displayName}[${user.profile.email[0]}]: ${err}`);
          res.redirect('/error/403');
        });
      } catch(err) {
        helpers.alert && helpers.alert(`POST /ln/reset: Error in sendEmail: ${err}`);
        res.redirect('/error/400');
      }
    } else {
      helpers.alert && helpers.alert('Cannot find account in environment variable APPS');
      res.redirect('/error/403');
    }
  }
}

function responseSuccessPage() {
  return function(req, res) {
    const dom = `
      <div class="w3-container" style="margin: 32px 0">
        <h3> Email Sent </h3>
        <p class="w3-text-red">An email has been sent to <span class="w3-text-blue">${req.body.email}</span>. Please check your inbox and follow the instruction.</p>
        <p class="w3-text-grey"> Thank you. </p>
      </div>
    `
    res.writeHead( 200, { "Content-Type": "text/html" } );
    res.end(html({ title: 'Success', dom, data: {targetOrigin: res.locals.app.url} }));
  }
}

module.exports = [validateParams, verifyApp, findUser, createToken, sendEmail, responseSuccessPage];
