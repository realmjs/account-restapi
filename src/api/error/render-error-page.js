"use strict"

const html = require('../../lib/html');

const errors = {
  '400': { title: '400 Bad request', message: 'The request are not in the right format' },
  '403': { title: '403 Forbidden', message: `Sorry! The permission is needed` },
  '404': { title: '404 Resource not found', message: 'The resource you have requested does not exist' },
  '500': { title: '500 Internal error', message: 'Opps!!! Something went wrong. Please try again later' },
};

function render() {
  return function(req, res) {
    const err = req.params.code ? errors[req.params.code] : error['404'];
    const dom = `
      <div class="w3-container" style="margin: 32px 0">
        <h3 class="w3-text-red">${err.title}</h3>
        <p class="w3-text-grey"> ${err.message} </p>
      </div>
    `
    res.writeHead( req.params.code || 404, { "Content-Type": "text/html" } );
    res.end(html({title: err.title, dom}));
  }
}

module.exports = render;
