"use strict"

const html = require('../../lib/html')

function render(helpers) {
  return function(req, res) {
    if (!(req.query && req.query.name)) {
      _renderError(req, res, 400, 'Invalid parameters')
      return
    }
    if (!(req.query && req.query.app)) {
      _renderError(req, res, 400, 'Invalid parameters')
      return
    }
    const app = helpers.Apps.find( app => app.id === req.query.app )
    if (app) {
      const title = req.query.title || 'Form'
      const name = req.query.name
      _renderForm(req, res, name, title, app, req.query)
    } else {
      _renderError(req, res, 403, 'Application is not registered')
    }
  }
}

function _renderError(req, res, code, detail) {
  const errorCode = {
    '400' : '400 Bad request',
    '403' : '403 Forbidden'
  }
  const data = { route: 'error', error: {code: errorCode[code], detail} }
  if (req.query && req.query.height) { data.height= req.query.height }
  if (req.query && req.query.width) { data.width= req.query.width }
  res.writeHead( code, { "Content-Type": "text/html" } )
  res.end(html({title: 'Error', data, script: process.env.SCRIPT}))
}

function _renderForm(req, res, name, title, app, query) {
  const data = { route: name, targetOrigin: app.url, app: app.id, query }
  if (req.query && req.query.height) { data.height= req.query.height }
  if (req.query && req.query.width) { data.width= req.query.width }
  res.writeHead( 200, { "Content-Type": "text/html" } )
  res.end(html({title, data, script: process.env.SCRIPT}))
}

module.exports = render
