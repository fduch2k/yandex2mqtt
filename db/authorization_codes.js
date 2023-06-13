'use strict';

const { logger } = require('../logger');
const codes = {};

module.exports.find = (key, done) => {
    if (codes[key]) {
        return done(null, codes[key]);
    } else {
        logger.log('error', new Error('Code Not Found'));
        return done();
    }
};

module.exports.save = (code, clientId, redirectUri, userId, userName, done) => {
    codes[code] = {clientId, redirectUri, userId, userName};
    done();
};
