'use strict';

const { logger } = require('../logger');
const {users} = require('../config');

module.exports.findById = (id, done) => {
    for (const user of users) {
        if (user.id === id) return done(null, user);
    }
    logger.log('error', new Error('User Not Found'));
    return done();
};

module.exports.findByUsername = (username, done) => {
    for (const user of users) {
        if (user.username === username) return done(null, user);
    }
    logger.log('error', new Error('User Not Found'));
    return done();
};
