# oauth24d node example

Implement oauth24d using NodeJS :sparkles:

## Details

A NodeJS sample app using `express`, `passport`, and an in memory "database". First run `npm install`, and then `npm start` to access the implementation yourself (defaults to port `3000`) or `npm install` to run the automated tests.

You can customize the implementation with the following environment variables:

+ PORT - the port to listen on (default: `3000`)
+ DB_GC - the interval in `ms` at which the "database" will be garbage collected (default: `30000`)
+ AUTH_EXP - the oauth24d session expiration time in `s` (default: `1800`)
+ AUTH_INTERVAL - the oauth24d device polling interval in `s` (default: `5`)
+ AUTH_URI - the oauth24d `verification_url` (default: `http://localhost:3000/login`)

You can configure a real passport application by changing the following:

+ `app.js` - change existing `passport.use()` call to use a real passport provider
+ `oauth24d.js` - change `authorize()` passport strategy identifier string