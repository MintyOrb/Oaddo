'use strict';

var Hapi = require('hapi');

//server config
var config = {
    hostname: 'localhost',
    port: 8000,
    urls: {
        failureRedirect: '/login',
        successRedirect: '/'
    },
    facebook: {
        clientID: "...",
        clientSecret: "...",
        callbackURL: "http://localhost:8000/auth/facebook/callback"
    }
};

//hapi plugins
var plugins = {
    yar: {
        cookieOptions: {
            password: 'worldofwalmart', // cookie secret
            isSecure: false // required for non-https applications
        }
    },
    travelogue: config
};


var server = new Hapi.Server(config.hostname, config.port);
server.pack.allow({ ext: true }).require(plugins, function (err) { 

    if (err) {
        throw err;
    }
});

var Passport = server.plugins.travelogue.passport;

// Follow normal Passport rules to add Strategies
Passport.use(facebook);
Passport.serializeUser(ser);
Passport.deserializeUser(deser);



// routes
server.route([        

	//utility routes
    { method: 'GET', path: '/partials/{path*}', handler: { directory: { path: './public/views/partials' } } }, 
    { method: 'GET', path: '/css/{path*}', handler: { directory: { path: './public/css' } } },
    { method: 'GET', path: '/img/{path*}', handler: { directory: { path: './public/images' } } },
    { method: 'GET', path: '/js/{path*}', handler: { directory: { path: './public/js' } } },

    //serve index as entry point into angular app
    { method: 'GET', path: '/{path*}', handler: {file: './public/views/index.html'} }

    //api routes

]);     

// Start the server
server.start(function () {
    console.log('server started on port: ', server.info.port);
});
