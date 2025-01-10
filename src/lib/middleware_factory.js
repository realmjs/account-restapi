"use strict"

const alertCrashedEvent = require('./util')

class MiddlewareFactory {

  middlewares = {}

  use(name, middleware) {
    this.middlewares[name] = middleware
    return this
  }

  create(name, ...params) {
    return this.middlewares[name](...params)
  }

}

const middlewareFactory = new MiddlewareFactory()

middlewareFactory
.use('validateAppThenStoreToLocals', validateAppThenStoreToLocals)

function validateAppThenStoreToLocals(checkInRequestType = 'byRequestQuery', filename) {

  return (checkInRequestType === 'byRequestBody')?
    validateAppInRequestBodyByMiddleware(filename)
    :
    validateAppInRequestQueryMiddleware(filename)

  function validateAppInRequestQueryMiddleware(filename) {
    return (helpers) => (req, res, next) => {
      helpers.Database.App.find({ id: req.query.a })
      .then(app => {
        if (app) {
          res.locals.app = app
          next()
        } else {
          res.writeHead( 403, { "Content-Type": "text/html" } )
          res.end(helpers.form('error', { code: 403, reason: 'Permission Denied' }))
        }
      })
      .catch( err =>
        helpers.alert && alertCrashedEvent(helpers.alert, filename, 'validateApp', err)
      )
    }
  }

  function validateAppInRequestBodyByMiddleware(filename) {
    return (helpers) => (req, res, next) => {
      helpers.Database.App.find({ id: req.body.app })
      .then(app => {
        if (app) {
          res.locals.app = app
          next()
        } else {
          res.status(403).send('Permission Denied')
        }
      })
      .catch( err =>
        helpers.alert && alertCrashedEvent(helpers.alert, filename, 'validateApp', err)
      )
    }
  }

}



module.exports = middlewareFactory
