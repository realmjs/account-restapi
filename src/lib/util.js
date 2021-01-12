"use strict"

const jwt = require('jsonwebtoken')

const crypto = require('crypto')

const COOKIE_SESSION = '__r_c_sess_';

function authenUserMiddleware() {
  return function(req, res, next) {
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader === 'undefined') {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const bearer = bearerHeader.split(" ");
    const token = bearer[1];
    req.token = token;
    const secret = req.app.key;
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        res.status(401).json({ error: 'Unauthorized' });
      } else {
        req.uid = decoded.uid;
        next();
      }
    });
  }
}

function generateAuthenTokenMiddleware(helpers) {
  return function(req, res, next) {
    const user = req.user;
    const data = { uid: user.uid };
    if (user.realms[req.app.realm] && user.realms[req.app.realm].roles) {
      data.roles = user.realms[req.app.realm].roles;
    }
    req.authenToken = jwt.sign(data, req.app.key);
    next();
  }
}

function setHttpCookieMiddleware() {
  return function(req, res, next) {
    const cookie = encodeCookie(req.user);
    res.cookie(`${COOKIE_SESSION}_${req.app.realm}`, cookie, { httpOnly: true });
    next();
  }
}

function cleanCookieMiddleware() {
  return function(req, res, next) {
    res.clearCookie(`${COOKIE_SESSION}_${req.app.realm}`);
    next();
  }
}

function encodeCookie(user) {
  return JSON.stringify({
    uid: jwt.sign({uid: user.uid}, process.env.COOKIE_SECRET_KEY),
    sessionId: Math.random().toString(36).substr(2,9),
  });
}

function decodeCookie(cookies, app) {
  return new Promise((resolve, reject) => {
    if (!cookies || !cookies[`${COOKIE_SESSION}_${app.realm}`]) { resolve(null); return; }
    let session = {};
    try {
      session = JSON.parse(cookies[`${COOKIE_SESSION}_${app.realm}`]);
    } catch (err) {
      reject(`Error when parsing JSON: ${cookies[`${COOKIE_SESSION}_${app.realm}`]}`);
      return;
    }
    if (!session.uid) { resolve(null); return; }
    jwt.verify(session.uid, process.env.COOKIE_SECRET_KEY, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve({ uid: decoded.uid, sessionId: session.sessionId });
      }
    })
  })
}

function serializeUser(user) {
  const _user = {...user};
  delete _user.uid;
  delete _user.credentials;
  delete _user.realms;
  return _user;
}

function checkPassword(user, password) {
  return user.credentials.password === hashPassword(password);
}

function hashPassword(password) {
  const hash = crypto.createHash('sha256');
  const head = process.env.PWD_PREFIX;
  const tail = process.env.PWD_SUFFIX;
  hash.update(`${head}${password}${tail}`);
  return hash.digest('hex');
}

module.exports = { authenUserMiddleware, generateAuthenTokenMiddleware, setHttpCookieMiddleware, cleanCookieMiddleware, encodeCookie, decodeCookie, serializeUser, checkPassword, hashPassword }
