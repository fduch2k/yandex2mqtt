const fs = require('fs');

const devices = fs.readdirSync(`${__dirname}/rooms/`).reduce((result, item) => {
    if (fs.lstatSync(`${__dirname}/rooms/${item}`).isDirectory()) {
        result = [...result, ...require(`${__dirname}/rooms/${item}`) ];
    }
    return result
}, []);

module.exports = devices;
