const supertest = require('supertest')

const app = require('../app')

describe('oauth24d', () => {
    it('should create sessions', (done) => {
        supertest(app)
            .get('/new')
            
            .expect('Content-Type', /json/)
            .expect(200, done)
    })

    it('should be unable to poll invalid sessions', (done) => {
        supertest(app)
            .get('/poll?device_code=aabbcc')
            .expect(400, /malformed/, done)
    })

    it('should be able to poll valid sessions', (done) => {
        const test = supertest(app)

        test.get('/new')
            .then((res) => {
                const deviceCode = res.body.device_code

                return test.get(`/poll?device_code=${deviceCode}`)
                    .expect(400, /pending/)
                    .then(() => { /* empty result */ })
            })
            .then(done, done)
    })

    it('should be able to login', (done) => {
        supertest(app)
            .get('/login')
            .expect(200, '<form action=\'/submit\' method=\'POST\'><input type=\'text\' name=\'user_code\' /></form>', done)
    })

    it('should be unable to submit invalid codes', (done) => {
        supertest(app)
            .post('/submit')
            .send("user_code=abc123==")
            .expect(400, /malformed/, done)
    })

    it('should be able to submit valid codes', (done) => {
        const test = supertest(app)

        test.get('/new')
            .then((res) => {
                const userCode = res.body.user_code

                return test.post('/submit')
                    .send(`user_code=${userCode}`)
                    .expect(200, /OK/)
                    .then(() => { /* empty result */ })
            })
            .then(done, done)
    })

    it('should be able to e2e succeed', (done) => {
        const test = supertest(app)

        let deviceCode, userCode

        test.get('/new')
            .then((res) => {
                deviceCode = res.body.device_code
                userCode = res.body.user_code
            })
            .then(() => {
                return test.get(`/poll?device_code=${deviceCode}`)
                    .expect(400, /pending/)
                    .then(() => { /* empty result */ })
            })
            .then(() => {
                return test.post('/submit')
                    .send(`user_code=${userCode}`)
                    .expect(200, /OK/)
                    .then(() => { /* empty result */ })
            })  
            .then(() => {
                return test.get(`/poll?device_code=${deviceCode}`)
                    .expect(200, /access_token/)
                    .then(() => { /* empty result */ })
            })  
            .then(() => {
                return test.get(`/poll?device_code=${deviceCode}`)
                    .expect(400, /malformed/)
                    .then(() => { /* empty result */ })
            })
            .then(done, done)
    })
})