/*jslint node: true */
'use strict';

//import dependencies
var Hapi = require('hapi'),
	LocalStrategy = require('passport-local').Strategy,
    handlers = require("./handlers");

//server config
var config = {
    hostname: 'localhost',
    port: 8000,
    urls: {
        successRedirect:'/loginSuccess',
        failureRedirect:'/loginFailure'
    }
};

var options = { 
    payload:{
        maxBytes:104857600 //100 mb
    }
        
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
var server = new Hapi.Server(config.hostname, config.port, options);

server.pack.require(plugins, function (err) { 

    if (err) {
        throw err;
    }
});
server.auth.strategy('passport', 'passport');

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
    console.log(JSON.stringify(obj));
    done(null, obj);
});

// routes
server.route([        

	//resource routes
    // { method: 'GET', path: '/public/{path*}', handler: { directory: { path: './public/' } } }, 
    { method: 'GET', path: '/bower_components/{path*}', handler: { directory: { path: './public/bower_components/' } } },
    { method: 'GET', path: '/resources/{path*}', handler: { directory: { path: './public/resources/' } } }, 
    { method: 'GET', path: '/app/{path*}', handler: { directory: { path: './public/app/' } } },
    { method: 'GET', path: '/img/{path*}', handler: { directory: { path: './public/images/' } } },

    //serve index as entry point into angular app
    { method: 'GET', path: '/{path*}', handler: {file: './public/app/index.html'} },

    //auth routes
    { method: 'POST', path: '/login', config: {
            handler: function (request, reply) {

                console.log("/login handler here.");
    
                Passport.authenticate('local', {
                    successRedirect: config.urls.successRedirect,
                    failureRedirect: config.urls.failureRedirect
                })(request, reply);
            }
        }
    },
    
    //responding with 200 rather than 401 because http-auth module logs all 401s
    //and resends the requests after a successful login. ie login failure attempts
    //would be resent if 401 used.
    { method: 'GET', path: '/loginFailure', handler: function(request, reply){
        console.log("login failure. about to reply with a 200 anyway");
        reply({message:"Incorrect Username or Password"});
    }},
    //NOTE: this is probably a terrible security fault.
    { method: 'GET', path: '/loginSuccess', config: {auth: 'passport'}, handler: function(request, reply){
        console.log("successful login here. about to reply with a 200...");
        reply({loginSuccessful:true});
    }},


    //api routes
    { method: 'POST', path: '/user', handler: handlers.addAccount },

    { method: 'GET', path: '/loggedin', handler: handlers.loggedin},

    { method: 'POST', path: '/logout', handler: handlers.logout},

    { method: 'GET', path: '/test', config: {auth: 'passport'} , handler: function(request, reply){
        console.log("user must be logged on for you to see this...");
        reply({message: 'Oh, hey! You must be logged in.'});
    }},

    { method: 'POST', path: '/term', config: {auth: 'passport'}, handler: handlers.addTerm},

    { method: 'GET', path: '/explore/term', config: {auth: 'passport'}, handler: handlers.relatedTerms},

    { method: 'POST', path: '/newImage', config: {auth: 'passport'}, handler: handlers.addImageFile},

    { method: 'POST', path: '/content', config: {auth: 'passport'}, handler: handlers.addContentFromURL},

    { method: 'GET', path: '/termTypeAhead', handler: handlers.termTypeAhead},

]);     

// Start the server
server.start(function () {
    console.log('server started on port: ', server.info.port);
});
