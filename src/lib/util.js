"use strict"

const jwt = require('jsonwebtoken')

const crypto = require('crypto')

const COOKIE_SESSION = '__r_c_sess_'

function authenUserMiddleware() {
  return function(req, res, next) {
    const bearerHeader = req.headers['authorization']
    if (typeof bearerHeader === 'undefined') {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    const bearer = bearerHeader.split(" ");
    const token = bearer[1];
    req.token = token;
    jwt.verify(token, process.env.REALM_SECRET_KEY, (err, decoded) => {
      if (err) {
        res.status(401).json({ error: 'Unauthorized' })
      } else {
        req.uid = decoded.uid
        next()
      }
    })
  }
}

function generateAuthenTokenMiddleware() {
  return function(req, res, next) {
    const user = req.user
    const secret = process.env.REALM_SECRET_KEY
    req.authenToken = jwt.sign({ uid: user.uid }, secret)
    next()
  }
}

function setHttpCookieMiddleware() {
  return function(req, res, next) {
    const cookie = encodeCookie(req.user)
    res.cookie(COOKIE_SESSION, cookie, { httpOnly: true })
    next()
  }
}

function cleanCookieMiddleware() {
  return function(req, res, next) {
    res.clearCookie(COOKIE_SESSION)
    next()
  }
}

function encodeCookie(user) {
  return JSON.stringify({
    uid: jwt.sign({uid: user.uid}, process.env.COOKIE_SECRET_KEY),
    clientId: Math.random().toString(36).substr(2,9)
  })
}

function decodeCookie(cookies) {
  return new Promise((resolve, reject) => {
    if (!cookies || !cookies[COOKIE_SESSION]) { reject('no_cookie'); return }
    const session = JSON.parse(cookies[COOKIE_SESSION])
    if (!session.uid) { reject('invalid_session'); return }
    jwt.verify(session.uid, process.env.COOKIE_SECRET_KEY, (err, decoded) => {
      if (err) {
        reject(err)
      } else {
        resolve({ uid: decoded.uid, clientId: session.clientId })
      }
    })
  })
}

function serializeUser(user) {
  const _user = {...user}
  delete _user.uid
  delete _user.credentials
  return _user
}

function checkPassword(user, password) {
  return user.credentials.password === hashPassword(password)
}

function hashPassword(password) {
  const hash = crypto.createHash('sha256')
  const head = process.env.PWD_PREFIX
  const tail = process.env.PWD_SUFFIX
  hash.update(`${head}${password}${tail}`)
  return hash.digest('hex')
}

module.exports = { authenUserMiddleware, generateAuthenTokenMiddleware, setHttpCookieMiddleware, cleanCookieMiddleware, encodeCookie, decodeCookie, serializeUser, checkPassword, hashPassword }
