"use strict"

const jwt = require('jsonwebtoken')

const crypto = require('crypto')

function isEmail(str) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(str);
}

function createSessionToken(user, app) {
  const data = { uid: user.uid };
  if (user.realms[app.realm] && user.realms[app.realm].roles) {
    data.roles = user.realms[app.realm].roles;
  }
  return jwt.sign(data, app.key);
}

function createCookie(uid, realm) {
  const cookie = JSON.stringify({
    uid: jwt.sign({uid}, process.env.COOKIE_SECRET_KEY),
    sessionId:  ustring(8)
  })
  return [
    `${process.env.COOKIE_SESSION}_${realm}`,
    cookie,
    { httpOnly: true, sameSite: 'strict', secure: true }
  ]
}

function cleanCookieMiddleware() {
  return function(req, res, next) {
    res.clearCookie(`${process.env.COOKIE_SESSION}_${res.locals.app.realm}`);
    next();
  }
}

function decodeCookie(cookies, app) {
  return new Promise((resolve, reject) => {
    if (!cookies || !cookies[`${process.env.COOKIE_SESSION}_${app.realm}`]) {
      resolve(null)
      return
    }
    let session = {}
    try {
      session = JSON.parse(cookies[`${process.env.COOKIE_SESSION}_${app.realm}`])
    } catch (err) {
      reject(`Error when parsing JSON: ${cookies[`${process.env.COOKIE_SESSION}_${app.realm}`]}`)
      return
    }
    if (!session.uid) { resolve(null); return; }
    jwt.verify(session.uid, process.env.COOKIE_SECRET_KEY, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve({ uid: decoded.uid, sessionId: session.sessionId })
      }
    })
  })
}

function maskUser(user) {
  const masks = ['uid', 'salty', 'credentials', 'realms']
  const maskedUser = {}
  for (let prop in user) {
    if (masks.indexOf(prop) === -1) {
      maskedUser[prop] = user[prop]
    }
  }
  return maskedUser
}

function matchUserPassword(user, password) {
  return user.credentials.password === hashPassword(password, user.salty);
}

function hashPassword(password, salty) {
  const hash = crypto.createHash('sha256');
  const head = salty.head;
  const tail = salty.tail;
  hash.update(`${head}${password}${tail}`);
  return hash.digest('hex');
}

function hashEmail(email) {
  const [username, domainname] = email.trim().split('@')
  const hash = crypto.createHash('sha256')
  hash.update(`#${process.env.EMAIL_NAME_SALTY}#${username}@#${process.env.EMAIL_DOMAIN_SALTY}#${domainname}`)
  return hash.digest('hex')
}

function ustring(ln) {
  return Math.random().toString(36).substring(2,ln+2);
}

function alertCrashedEvent(alertFn, file, func, err) {
  alertFn(`
    Server Crashed!
    When: ${new Date()}
    File: ${file}
    Function: ${func}
    Error:
    ${err}
  `)
}

function verifyRealm(app, user) {
  return Object.keys(user.realms).indexOf(app.realm) !== -1 &&
         user.realms[app.realm].roles &&
         user.realms[app.realm].roles.length > 0
}

module.exports = {
  isEmail,
  maskUser,
  cleanCookieMiddleware,
  createCookie,
  decodeCookie,
  matchUserPassword,
  hashPassword,
  hashEmail,
  createSessionToken,
  ustring,
  alertCrashedEvent,
  verifyRealm,
};
