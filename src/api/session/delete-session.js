"use strict"

const { cleanCookieMiddleware } = require('../../lib/util')

function validateParams(helpers) {
  return function(req, res, next) {
    if (!req.body.app) {
      res.status(400).json({ error: 'Bad request'})
      return
    }
    const app = helpers.Apps.find( app => app.id === req.body.app )
    if (app) {
      next()
    } else {
      res.status(204).json({ message: 'No content' })
    }
  }
}

function done(helpers) {
  return function(req, res) {
    res.status(200).json({ message: 'Success' })
  }
}

module.exports = [validateParams, cleanCookieMiddleware, done]
