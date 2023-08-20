"use strict"

const { alertCrashedEvent, authenticateRequestMiddleware} = require('../../lib/util')

const getAdminApp = (helpers) => async (req, res, next) => {
  try {
    res.locals.app = await helpers.Database.App.find({ id: 'account' })
    next()
  } catch(err) {
    helpers.alert && alertCrashedEvent(helpers.alert, 'query_account.js', 'getAdminApp', err)
    res.status(500).send()
  }
}

const getAccount= (helpers) => async (req, res, next) => {
  try {
    res.locals.account = await helpers.Database.Account.find({uid: req.params.uid})
    next()
  } catch(err) {
    helpers.alert && alertCrashedEvent(helpers.alert, 'query_account.js', 'getAccount', err)
    res.status(500).send()
  }
}

const final = () => (req, res) =>
  res.locals.account ?
    res.status(200).json({
      uid: res.locals.account.uid,
      email: res.locals.account.email,
      profile: res.locals.account.profile,
      createdAt: res.locals.account.createdAt,
    })
  :
    res.status(404).json({ error: 'Not found'})

module.exports = [
  getAdminApp,
  authenticateRequestMiddleware,
  getAccount,
  final
]