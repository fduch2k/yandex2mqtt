const fs = require('fs');
const path = require('path');

const roomInfo = {
    name: 'Новая комната',
    id: path.basename(__dirname),
};

const devicesInRoom = fs.readdirSync(`${__dirname}/`).reduce((result, file) => {
    if (path.basename(__filename) !== file || path.extname(file) !== '.js') {
        const device = require(`${__dirname}/${file}`)(roomInfo);
        result.push(device);
    }
    return result;
}, []);

module.exports = devicesInRoom;
