"use strict"

const jwt = require('jsonwebtoken')

function validateParams() {
  return function(req, res, next) {
    if (req.body && req.body.token, req.body.profile) {
      next()
    } else {
      res.status(400).json({ error: 'Bad request'})
    }
  }
}
function authen() {
  return function(req, res, next) {
    const token = req.body.token
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

function update(helpers) {
  return function(req, res) {
    const profile = req.body.profile
    helpers.Database.USERS.set({ uid: req.uid }, { profile })
    .then( update => {
      res.status(200).json({ update })
    })
    .catch(err => {
      helpers.alert && helpers.alert(err)
      res.status(500).json({ error: 'Database access failed!'})
    })
  }
}

module.exports = [validateParams, authen, update]
