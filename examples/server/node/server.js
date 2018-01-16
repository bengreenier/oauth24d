const app = require('./app')

const server = app.listen(process.env.PORT || 3000, () => {
    const addr = server.address()
    console.log(`listening on [${addr.address}]:${addr.port}`)
})