// Allows us to use ES6 in our migrations and tests.
require('babel-register')

module.exports = {
    networks: {
        "main": {
            network_id: 1,
            gas: 500000
        },

        development: {
            host: 'localhost',
            port: 8545,
            network_id: '*' // Match any network id
        }
    }
}
