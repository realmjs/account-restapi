"use strict"

module.exports = ({title, data, style, script, dom}) => `
<!DOCTYPE html>
<html class="w3-light-grey">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1,  shrink-to-fit=no">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <title>${title}</title>
    ${style === false? '' : `
    <link rel="stylesheet" type="text/css" href=${process.env.STYLE_W3}>
	  <link rel="stylesheet" href=${process.env.STYLE_FA}>
    `}
  </head>

  <body>
    <div id="root">${dom || ''}</div>
    <script> var __data=${JSON.stringify(data)} </script>
    ${script? `<script type="text/javascript" src="${script}" ></script>` : ''}
  </body>

</html>
`
