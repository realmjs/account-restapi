# @realmjs/account-restapi

This package provides a RESTful API for managing user accounts. It is designed to work seamlessly with the `@realmjs/account-form` package.
The example of usage provided below demonstrates how to integrate this package into an Express.js application.

## Installation

```bash
npm install @realmjs/account-restapi --save
```

## Configuration

Before using the package, make sure to set the required environment parameters in a `.env` file. Below are the environment parameters that need to be configured:

```env
COOKIE_SESSION=<cookie-session>
COOKIE_SECRET_KEY=<cookie-secret-key>
EMAIL_NAME_SALTY=<email-name-salty>
EMAIL_DOMAIN_SALTY=<email-domain-salty>
EMAIL_VALIDATION_SIGN_KEY=<email-sign-key>
EMAIL_EXPIRE_VALIDATION_LINK=<24h>
```

## Example Usage

```javascript
"use strict"

// Load environment variables from .env file
require('dotenv').config({ path: 'account/.env' })

// Import the @realmjs/account-restapi package
const api = require('@realmjs/account-restapi')

// Import and configure helper functions
// It must provide Database interface
const helpers = require('./helpers')
api.helpers(helpers)

// Import necessary modules
const express = require('express')
const app = express()

// Middleware to log requests and introduce a delay
app.use('/',
  (req, res, next) => { console.log(`account: ${req.method.toUpperCase()} request to: ${req.path}`); next() },
  (req, res, next) => setTimeout(_ => next(), 1000),
  api.generate()
);

// Import and use the middleware from @realmjs/account-form
// It generates sign-up, sign-in forms...
const FormMiddleware = require('@realmjs/account-form/ExpressMiddleware')
app.use(...FormMiddleware)

// Set up the server
const PORT = process.argv[2] && parseInt(process.argv[2]) || 3100;
app.listen(PORT, function(err) {
  if (err) {
    console.log('Failed to start server!!!');
    console.log(err);
  } else {
    console.log('------------------------------------------------------------');
    console.log(`- @realmjs/account-demo server is running at port ${PORT}`);
    console.log('------------------------------------------------------------');
  }
})
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.