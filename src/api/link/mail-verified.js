" use strict"

const html = require('../../lib/html');

function render() {
  return function(req, res) {
    const dom = `
      <div class="w3-container w3-large">
        <p class="w3-padding w3-card w3-white w3-text-grey" style="max-width: 480px; margin: 48px auto">
        <i class="w3-cell fas fa-envelope w3-text-blue w3-xlarge"></i>
        <span class="w3-cell">Your email is verified <i class="fas fa-check w3-text-blue"></i></span>
        </p>
      </div>
    `
    res.writeHead( 200, { "Content-Type": "text/html" } );
    res.end(html({title: 'Email Verified', dom}));
  }
}

module.exports = render;
