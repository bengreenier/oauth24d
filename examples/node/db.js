const uuid = require('uuid')
const moment = require('moment')

const deviceStore = {}
const userStore = {}

// store gc
setInterval(() => {
    for (var prop in deviceStore) {
        // check if auth is expired, and delete if it is
        if (moment().isAfter(deviceStore[prop].metaData.expires_at)) {
            delete userStore[deviceStore[prop].metaData.userId]
            delete deviceStore[prop]
        }
    }
}, process.env.DB_GC || 30 * 1000)

module.exports = {
    getSessionByDeviceId: (deviceId) => {
        return deviceStore[deviceId]
    },
    getSessionByUserId: (userId) => {
        return userStore[userId]
    },
    deleteSessionByDeviceId: (deviceId) => {
        const session = deviceStore[deviceId]

        if (session) {
            delete userStore[session.metaData.userId]
            delete deviceStore[deviceId]
        }
    },
    createSession: (expiration, interval, verificationUrl) => {
        let deviceId, userId

        do
        {
            deviceId = uuid()
            userId = uuid().substr(10, 8)
        }
        while (deviceStore[deviceId] || userStore[userId])

        const deviceData = {
            device_code: deviceId,
            user_code: userId,
            expires_in: expiration,
            interval: interval,
            verification_url: verificationUrl
        }

        deviceStore[deviceId] = {
            deviceData,
            metaData: {
                expires_at: moment().add(expiration, 's'),
                userId: userId
            }
        }

        const userData = {
            access_token: null
        }

        userStore[userId] = {
            userData,
            metaData: {
                deviceId: deviceId
            }
        }

        return deviceData
    }
}