"use strict"

const uuid = require('uuid/v1');
const jwt = require('jsonwebtoken');

const { hashPassword, generateAuthenTokenMiddleware, setHttpCookieMiddleware, serializeUser } = require('../../lib/util');

function validateParameters() {
  return function(req, res, next) {
    const user = req.body.user;
    if (user && user.email && user.password && req.body.app) {
      next();
    } else {
      res.status(400).send({ error: 'Bad Request'});
    }
  }
}

function verifyApp(helpers) {
  return function(req, res, next) {
    const app = helpers.Apps.find( app => app.id === req.body.app );
    if (app) {
      req.app = app;
      next();
    } else {
      res.status(400).send({ error: 'Bad Request'});
    }
  }
}

function checkUserExistance(helpers) {
  return function(req, res, next) {
    const user = req.body.user;
    helpers.Database.LOGIN.find({ username: `= ${user.email}`})
    .then( users => {
      if (users && users.length > 0) {
        res.status(403).send({ error: 'Forbidden' });
      } else {
        next();
      }
    })
    .catch( err => {
      helpers.alert && helpers.alert(`POST /user: Error in checkUserExistance: ${err}`);
      res.status(403).json({ error: 'Forbidden' });
    });
  }
}

function createUser(helpers) {
  return function(req, res, next) {
    const profile = { ...req.body.user.profile };
    // mark empty field as N/A if any
    for (let prop in profile) {
      if (typeof profile[prop] === 'string' && profile[prop].length === 0) {
        profile[prop]  = 'N/A';
      }
    }
    profile.picture = process.env.DEFAULT_PROFILE_PICTURE;

    if (!profile.email || profile.email.length === 0) {
      profile.email = [req.body.user.email];
    }

    if (!profile.displayName) {
      profile.displayName = req.body.user.email.split('@')[0];
    }

    const realms = {};
    realms[req.app.realm] = {
      roles: ['member']
    };
    const user = {
      username: req.body.user.email.toLowerCase().trim(),
      uid: uuid(),
      credentials: { password: hashPassword(req.body.user.password) },
      profile,
      verified: false,
      createdAt: (new Date()).getTime(),
      realms,
    };

    helpers.Database.USER.insert(user)
    .then( user => { req.user = user; next(); })
    .catch( err => {
      helpers.alert && helpers.alert(`POST /user: Error in createUser: ${err}`);
      res.status(403).json({ error: 'Forbidden' });
    });

  }
}

function sendEmail(helpers) {
  return function(req, res, next) {
    if (helpers.sendEmail) {
      /* generate token to active email */
      const user = req.user;
      const account = helpers.Apps.find(app => app.id === 'account');

      if (account) {

        let token;
        try {
        token = jwt.sign(
                  {uid: user.uid},
                  process.env.EMAIL_SIGN_KEY,
                  { expiresIn: process.env.EMAIL_EXPIRE_RESET_LINK }
                );
        } catch (err) {
          helpers.alert && helpers.alert(`POST /user: Error in sendEmail: ${err}`);
        }

        helpers.sendEmail({
          recipient: [{ address: user.profile.email[0], name: user.profile.displayName }],
          template: 'verifyemail',
          data: { customer: user.profile.displayName, endpoint:`${account.url}/ln/verify`, email: user.profile.email[0], token }
        })
        .then(() => next())
        .catch(err => {
          helpers.alert && helpers.alert(`User ${user.profile.displayName}[${user.profile.email[0]}] is created. But failed to send verification email`)
          next()
        });

      } else {
        helpers.alert && helpers.alert(`POST /user: Error in sendEmail: App account is not configured`);
        res.status(500).json({ error: 'Server configuration' });
      }
    }
  }
}

function hook(helpers) {
  return function(req, res, next) {
    if (helpers.hooks) {
      Promise.all(helpers.hooks.map(hook => hook({
        user: serializeUser(req.user),
        token: req.authenToken
      })))
      .then(() => next())
      .catch(err => {
        helpers.alert && helpers.alert(`POST /user: Error in hook: ${err}`);
        next();
      });
    }
  }
}

function responseSuccess() {
  return function(req, res) {
    const session = { user: serializeUser(req.user), token: req.authenToken, sid: req.sid };
    res.status(200).json({ session });
  }
}

module.exports = [validateParameters, verifyApp, checkUserExistance, createUser, generateAuthenTokenMiddleware, setHttpCookieMiddleware, sendEmail, hook, responseSuccess]
