"use strict"

/* Public for anyone who who the email, return the email itself */
function findUserByUsername(helpers) {
  return function(req, res, next) {
    if (req.query && req.query.u) {
      helpers.Database.USERS.find({ username: `= ${req.query.u}`})
      .then( user => {
        if (user && user.length > 0) {
          res.status(200).json({ username: req.query.u })
        } else {
          res.status(404).json({ error: 'Not found' })
        }
      })
      .catch( err => res.status(403).json({ error: 'Unable to access Database' }))
    } else {
      // find user by other attribute such as uid (token) need authenticate
      // it will be implemented by future
      // for now, simply return 400 bad request
      res.status(400).json({ error: 'Bad request' })
    }
  }
}

module.exports = [findUserByUsername]
