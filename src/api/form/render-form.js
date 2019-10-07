"use strict"

const html = require('../../lib/html')

function render(helpers) {
  return function(req, res) {
    if (!(req.query && req.query.name)) {
      _renderError(res, 400, 'Invalid parameters')
      return
    }
    if (!(req.query && req.query.app)) {
      _renderError(res, 400, 'Invalid parameters')
      return
    }
    const app = req.query.app
    helpers.Collections.Apps.find({app}, (apps) => {
      if (apps && apps[0]) {
        const title = req.query.title || 'Form'
        const name = req.query.name
        _renderForm(res, name, title, realm, apps[0], req.query)
      } else {
        _renderError(res, 403, 'Application is not registered')
      }
    })
  }
}

function _renderError(res, code, detail) {
  const errorCode = {
    '400' : '400 Bad request',
    '403' : '403 Forbidden'
  }
  const data = { route: 'error', error: {code: errorCode[code], detail} }
  res.writeHead( code, { "Content-Type": "text/html" } )
  res.end(html({title: 'Error', data, script: process.env.SCRIPT}))
}

function _renderForm(res, name, title, app, query) {
  const data = { route: name, targetOrigin: app.url, app: app.appId, query }
  res.writeHead( 200, { "Content-Type": "text/html" } )
  res.end(html({title, data, script: process.env.SCRIPT}))
}

module.exports = render
