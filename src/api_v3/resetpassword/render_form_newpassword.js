"use strict"

const validateRequest = (helpers) => (req, res, next) => {
  if (req.query.a && req.query.t) {
    next()
  } else {
    res.writeHead( 400, { "Content-Type": "text/html" } )
    res.end(helpers.form('error', { code: 400, reason: 'Bad query params' }))
  }
}

const final = (helpers) => (req, res) => {
  res.writeHead( 200, { "Content-Type": "text/html" } )
  res.end(helpers.form('newpassword', { token: req.query.t, app: req.query.a }))
}

module.exports = [
  validateRequest,
  final
]
