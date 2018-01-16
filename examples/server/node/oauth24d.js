const express = require('express')
const passport = require('passport')
const bodyParser = require('body-parser')
const moment = require('moment')
const db = require('./db')

const router = express.Router()

// update string after swapping app.js to a real strategy
const authorize = () => passport.authorize('fake-strategy') 

router.get('/new', (req, res) => {
    const session = db.createSession(
        process.env.AUTH_EXP || 1800,
        process.env.AUTH_INTERVAL || 5,
        process.env.AUTH_URI || "http://localhost:3000/login"
    )

    res.send(session)
})

router.get('/poll', (req, res) => {
    const deviceCode = req.query.device_code

    if (!deviceCode) {
        return res.status(400).send({error: 'malformed request'})        
    }

    const session = db.getSessionByDeviceId(deviceCode)

    if (!session) {
        return res.status(400).send({error: 'malformed request'})
    }

    if (moment().isAfter(session.metaData.expires_at)) {
        return res.status(400).send({error: 'code expired'})        
    }

    const userSession = db.getSessionByUserId(session.metaData.userId)

    if (!userSession || !userSession.access_token) {
        return res.status(400).send({error: 'pending'})
    }

    db.deleteSessionByDeviceId(deviceCode)

    res.send({
        access_token: userSession.access_token
    })
})

router.post('/submit', authorize(), bodyParser.urlencoded({ extended: true }), (req, res) => {
    const userCode = req.body.user_code

    if (!userCode) {
        return res.status(400).send({error: 'malformed request'})        
    }

    const session = db.getSessionByUserId(userCode)

    if (!session) {
        return res.status(400).send({error: 'malformed request'})
    }

    session.access_token = req.account.access_token

    res.status(200).send({"status": "OK"})
})

router.get('/login', authorize(), (req, res) => {
    res.send("<form action='/submit' method='POST'><input type='text' name='user_code' /></form>")
})


module.exports = router