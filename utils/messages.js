const moment = require('moment')

const formatMessages = (username, text) => {
    return {
        username,
        text,
        time: moment().format('h:mm a')
    }
}

module.exports = { formatMessages }