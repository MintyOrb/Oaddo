/*jslint node: true */
'use strict';

//import dependencies
var Hapi = require('hapi'),
	LocalStrategy = require('passport-local').Strategy,
    handlers = require("./handlers");

//server config
var config = {
    hostname: 'localhost',
    port: 8000
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
Passport.use(new LocalStrategy( handlers.authUser ) );

    //for sessions
Passport.serializeUser(function(user, done) {
    console.log("serial user: " + JSON.stringify(user));
    done(null, user);
});

Passport.deserializeUser(function (obj, done) {
    console.log("deserialize User here...");
    done(null, obj);
});

// routes
server.route([        

	//resource routes
    { method: 'GET', path: '/partials/{path*}', handler: { directory: { path: './public/' } } }, 
    { method: 'GET', path: '/resources/{path*}', handler: { directory: { path: './public/resources/' } } }, 
    { method: 'GET', path: '/css/{path*}', handler: { directory: { path: './public/css' } } },
    { method: 'GET', path: '/img/{path*}', handler: { directory: { path: './public/images' } } },
    { method: 'GET', path: '/js/{path*}', handler: { directory: { path: './public/' } } },

    //serve index as entry point into angular app
    { method: 'GET', path: '/{path*}', handler: {file: './public/index.html'} },

    //auth routes
    { method: 'POST', path: '/login', config: {
            handler: function (request, reply) {

                console.log("POST /login handler here.");
    
                Passport.authenticate('local')(request, function (err) {

                    console.log("successful authentication?");
    
                    if (err && err.isBoom) {
                        console.log("error and error is boom...");
                        // This would be a good place to flash error message
                    }
                    reply({message: "logged in"});
                });
            }
        }
    },

    //GET /login is a temporary work around...passport auth failure redirects here automatically.
    { method: 'GET', path: '/login', handler: function(request, reply){
        console.log("get login here. about to reply with a 401...");
        reply().code(401);
    }},


    //api routes
    // { method: 'GET', path: '/user/{id}', handler: handlers.authUser },
    { method: 'POST', path: '/user', handler: handlers.addAccount },

    { method: 'GET', path: '/loggedin', handler: handlers.loggedin},

    { method: 'POST', path: '/logout', handler: handlers.logout},

    { method: 'GET', path: '/test', config: {auth: 'passport'} , handler: function(request, reply){
        console.log("user must be logged on for you to see this...");
        reply({message: 'Oh, hey! You must be logged in.'});
    }},

    { method: 'POST', path: '/term', config: {auth: 'passport'}, handler: handlers.addTerm},

    { method: 'GET', path: '/explore/term', config: {auth: 'passport'}, handler: handlers.relatedTerms}

]);     

// Start the server
server.start(function () {
    console.log('server started on port: ', server.info.port);
});
