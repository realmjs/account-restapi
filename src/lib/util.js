"use strict"

const jwt = require('jsonwebtoken')

const crypto = require('crypto')

const COOKIE_SESSION = '__r_c_sess_'

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

module.exports = { generateAuthenTokenMiddleware, setHttpCookieMiddleware, encodeCookie, decodeCookie, serializeUser, checkPassword, hashPassword }
