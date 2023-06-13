'use strict';

const { logger } = require('../logger');
const {clients} = require('../config');

module.exports.findById = (id, done) => {
    for (const client of clients) {
        if (client.id === id) return done(null, client);
    }
    logger.log('error', new Error('Client Not Found'));
    return done();
};

module.exports.findByClientId = (clientId, done) => {
    for (const client of clients) {
        if (client.clientId === clientId) return done(null, client);
    }
    logger.log('error', new Error('Client Not Found'));
    return done();
};
