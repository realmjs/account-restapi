"use strict"

/* 01 Dec 2019: Updated API
   depending on the query u in GET methos.
   - If it is an email, then the API is public. API will return back email to indicate user exist
   - If it is a token, then the API required authenticated
*/

const jwt = require('jsonwebtoken')

const { isEmail } = require('../../lib/form')

function findUser(helpers) {
  return function (req, res) {
    if (req.query && req.query.u) {
      if (isEmail(req.query.u)) {
        /*
          Public API return user email
          Its usecase is for testing whether email is registered
        */
        helpers.Database.LOGIN.find({ username: `= ${req.query.u}`})
        .then( users => {
          if (users && users.length > 0) {
            res.status(200).json({ username: req.query.u })
          } else {
            res.status(404).json({ error: 'Not found' })
          }
        })
        .catch( err => {
          helpers.alert && helpers.alert(err)
          res.status(403).json({ error: 'Unable to access Database' })
        })
      } else {
        /*
          Authentication requred API, return username and profile
          It's usecase is for a server application request user information
        */
        const token = req.query.u
        jwt.verify(token, process.env.REALM_SECRET_KEY, (err, decoded) => {
          if (err) {
            res.status(401).json({ error: 'Unauthorized' })
            return
          }
          helpers.Database.USERS.find({ uid: `= ${decoded.uid}`})
          .then( users => {
            if (users && users.length > 0) {
              const user = users[0]
              res.status(200).json({ username: user.username, profile: user.profile })
            } else {
              res.status(404).json({ error: 'Not found' })
            }
          })
          .catch( err => {
            helpers.alert && helpers.alert(err)
            res.status(403).json({ error: 'Unable to access Database' })
          })
        })
      }
    } else {
      res.status(400).json({ error: 'Bad request' })
    }
  }
}

module.exports = [findUser]
