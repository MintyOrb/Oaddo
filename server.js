'use strict';

var Hapi = require('hapi'),
	LocalStrategy = require('passport-local').Strategy,
    handlers = require("./handlers");


//server config
var config = {
    hostname: 'localhost',
    port: 8000,
    urls: {
        failureRedirect: '/login',
        successRedirect: '/'
    },
    excludePaths: ['/public/']
};

//hapi plugins
var plugins = {
    yar: {
        cookieOptions: {
            password: 'WOWOWOWSOSECRET', // cookie secret
            isSecure: false // required for non-https applications
        }
    },
    travelogue: config
};

//init server
var server = new Hapi.Server(config.hostname, config.port);
server.pack.allow({ ext: true }).require(plugins, function (err) { 

    if (err) {
        throw err;
    }
});

//setup auth
var Passport = server.plugins.travelogue.passport;

Passport.use(new LocalStrategy(function (username, password, done) {handlers.findUser}));



// routes
server.route([        

	//utility routes
    { method: 'GET', path: '/partials/{path*}', handler: { directory: { path: './public/views/partials' } } }, 
    { method: 'GET', path: '/css/{path*}', handler: { directory: { path: './public/css' } } },
    { method: 'GET', path: '/img/{path*}', handler: { directory: { path: './public/images' } } },
    { method: 'GET', path: '/js/{path*}', handler: { directory: { path: './public/js' } } },

    //serve index as entry point into angular app
    { method: 'GET', path: '/{path*}', handler: {file: './public/views/index.html'} },

    //api routes
    { method: 'GET', path: '/user/{id}', handler: handlers.findUser },
    { method: 'POST', path: '/user', handler: handlers.addAccount },

    { method: 'GET', path: '/login', handler: handlers.login }

]);     

// Start the server
server.start(function () {
    console.log('server started on port: ', server.info.port);
});
