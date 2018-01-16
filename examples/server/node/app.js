const express = require('express')
const passport = require('passport')
const oauth24d = require('./oauth24d')

const app = express()

// swap with a real passport strategy
passport.use({
    name: "fake-strategy",
    authenticate: function (req) {
        this.success({
            access_token: "abc123=="
        }, {
            name: "fake user"
        })
    }
})

app.use(passport.initialize())
app.use(oauth24d)

module.exports = app