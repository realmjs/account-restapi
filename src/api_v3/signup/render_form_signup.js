"use strict"

module.exports = (helpers) => (req, res) => {
  res.writeHead( 200, { "Content-Type": "text/html" } )
  res.end(helpers.form('signup'))
}
