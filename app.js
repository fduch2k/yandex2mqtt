'use strict';

const fs = require('fs');
const path = require('path');
/* express and https */
const ejs = require('ejs');
const express = require('express');
const { logger } = require('./logger');


const app = express();
const http = require('http');
const https = require('https');

/* parsers */
const cookieParser = require('cookie-parser');
/* error handler */
const errorHandler = require('errorhandler');
/* seesion and passport */
const session = require('express-session');
const passport = require('passport');
/* mqtt client for devices */
const mqtt = require('mqtt');
/* */
const config = require('./config');
config.notification = config.notification || [];

const Device = require('./device');


/* */
app.engine('ejs', ejs.__express);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views'));
app.use(express.static('views'));
app.use(cookieParser());
app.use(express.json({
    extended: false,
}));
app.use(express.urlencoded({
    extended: true,
}));
app.use(errorHandler());
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
}));

/* passport */
app.use(passport.initialize());
app.use(passport.session());

/* passport auth */
require('./auth');

/* routers */
const {site: r_site, oauth2: r_oauth2, user: r_user, client: r_client} = require('./routes');

app.get('/', r_site.index);
app.get('/login', r_site.loginForm);
app.post('/login', r_site.login);
app.get('/logout', r_site.logout);
app.get('/account', r_site.account);
app.get('/dialog/authorize', r_oauth2.authorization);
app.post('/dialog/authorize/decision', r_oauth2.decision);
app.post('/oauth/token', r_oauth2.token);
app.get('/api/userinfo', r_user.info);
app.get('/api/clientinfo', r_client.info);
app.get('/provider/v1.0', r_user.ping);
app.get('/provider', r_user.ping);
app.get('/provider/v1.0/user/devices', r_user.devices);
app.post('/provider/v1.0/user/devices/query', r_user.query);
app.post('/provider/v1.0/user/devices/action', r_user.action);
app.post('/provider/v1.0/user/unlink', r_user.unlink);

const httpServer = http.createServer(app);
logger.log('info', `App started at ${config.http.port}`);
httpServer.listen(config.http.port);

/* cache devices from config to global */
global.devices = [];
if (config.devices) {
    config.devices.forEach(opts => {
        global.devices.push(new Device(opts));
    });
}

/* create subscriptions array */
const subscriptions = [];
global.devices.forEach(device => {
    device.data.custom_data.mqtt.forEach(mqtt => {
        const {instance, state: topic} = mqtt;
        if (instance != undefined && topic != undefined) {
            subscriptions.push({deviceId: device.data.id, instance, topic});
        }
    });
});

/* Create MQTT client (variable) in global */
global.mqttClient = mqtt.connect(`mqtt://${config.mqtt.host}`, {
    port: config.mqtt.port,
    username: config.mqtt.user,
    password: config.mqtt.password
}).on('connect', () => { /* on connect event handler */
    mqttClient.subscribe(subscriptions.map(pair => pair.topic));
}).on('offline', () => { /* on offline event handler */
    /* */
}).on('message', (topic, message) => { /* on get message event handler */
    const subscription = subscriptions.find(sub => topic.toLowerCase() === sub.topic.toLowerCase());
    if (subscription == undefined) return;

    const {deviceId, instance} = subscription;
    const ldevice = global.devices.find(d => d.data.id == deviceId);
    ldevice.updateState(`${message}`, instance);

    /* Make Request to Yandex Dialog notification API */
    Promise.all(config.notification.map(el => {
        let {skill_id, oauth_token, user_id} = el;

        return new Promise((resolve, reject) => {
            let req = https.request({
                hostname: 'dialogs.yandex.net',
                port: 443,
                path: `/api/v1/skills/${skill_id}/callback/state`,
                method: 'POST',
                headers: {
                    'Content-Type': `application/json`,
                    'Authorization': `OAuth ${oauth_token}`
                }
            }, res => {
                res.on('data', d => {
                    logger.log('info', {message: `${d}`});
                });
            });

            req.on('error', error => {
                logger.log('error', {message: `${error}`});
            });

            let {id, capabilities, properties} = ldevice.getState();
            req.write(JSON.stringify({
                "ts": Math.floor(Date.now() / 1000),
                "payload": {
                    "user_id": `${user_id}`,
                    "devices": [{
                        id,
                        capabilities: capabilities.filter(c => c.state.instance == instance),
                        properties: properties.filter(p => p.state.instance == instance)
                    }],
                }
            }));

            req.end();

            resolve(true);
        });
    }));

    /* */
});

module.exports = app;
