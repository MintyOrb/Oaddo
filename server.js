'use strict';

var Hapi = require('hapi'),
	LocalStrategy = require('passport-local').Strategy,
    handlers = require("./handlers"),
    //for deserialization... TODO reorganize
    neo4j = require('neo4j'),
    db = new neo4j.GraphDatabase('http://localhost:7474');

//server config
var config = {
    hostname: 'localhost',
    port: 8000,
    apiMode: true
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
    console.log("deserializeUser here...")
    done(null, obj);

    // function(id, done) {
    // console.log("deserial id: " + id);
    // console.log("deserial done: " + done);


    // var properties = { username: id };
    // var query = 'MATCH (memberNode:member {name: {username} }) RETURN memberNode.name AS name';    
    // db.query(query, properties, function (err, userInfo) {
    //     if (err) {console.log("error in db query: " + err)};
    //     if(userInfo[0] === undefined){
    //         console.log("name not found...oops...");
    //     } else {
    //         console.log(userInfo);
    //         done(err, userInfo)
    //     }
    // });
});

// routes
server.route([        

	//resource routes
    { method: 'GET', path: '/partials/{path*}', handler: { directory: { path: './public/views/partials' } } }, 
    { method: 'GET', path: '/css/{path*}', handler: { directory: { path: './public/css' } } },
    { method: 'GET', path: '/img/{path*}', handler: { directory: { path: './public/images' } } },
    { method: 'GET', path: '/js/{path*}', handler: { directory: { path: './public/js' } } },

    //serve index as entry point into angular app
    { method: 'GET', path: '/{path*}', handler: {file: './public/views/index.html'} },

    //api routes
    // { method: 'GET', path: '/user/{id}', handler: handlers.authUser },
    { method: 'POST', path: '/user', handler: handlers.addAccount },

    { method: 'GET', path: '/loggedin', handler: handlers.loggedin},

    { method: 'POST', path: '/logout', handler: handlers.logout},

    { method: 'GET', path: '/test', config: {auth: 'passport'}, handler: function(request, reply){
        console.log("user must be logged on for you to see this...");
        reply();
    }},

    { method: 'POST', path: '/login', config: {
            handler: function (request, reply) {

                console.log("/login handler here.");
    
                Passport.authenticate('local')(request, function (err) {

                    console.log("successful authentication?");
    
                    if (err && err.isBoom) {
                        console.log("error and error is boom...");
                        // This would be a good place to flash error message
                    }
                    //send what is missing to user (if incorrect)?
                    reply({message: "logged in"});
                });
            }
        }
    }
//     server.addRoute({
//     method: 'GET',
//     path: '/home',
//     config: { auth: 'passport' },
//     handler: function (request) {

//         // If logged in already, redirect to /home
//         // else to /login
//         request.reply("ACCESS GRANTED");
//     }
// });

]);     

// Start the server
server.start(function () {
    console.log('server started on port: ', server.info.port);
});
