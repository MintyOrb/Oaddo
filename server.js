/*jslint node: true */
'use strict';

//import dependencies
var Hapi = require('hapi'),
    handlers = require("./handlers"),
    LocalStrategy = require('passport-local').Strategy,
    authsession = require("./authsession");

//server config
var config = {
    hostname: '0.0.0.0',
    port: parseInt(process.env.PORT) || 8000,
    urls: {
        successRedirect:'/loginSuccess', //are these actually used?
        failureRedirect:'/loginFailure'
    }
};

var options = { 
    payload:{ maxBytes:104857600 } //100 mb   
};

//hapi plugins
var plugins = {
    yar: {
        cookieOptions: {
            password: 'WOWOWOWSOSECRET', // cookie secret // change to: process.env.COOKIE_SECRET || 'DEV', 
            isSecure: false // required for non-https applications
        }
    },
    travelogue: config
};

//init server
var server = module.exports.s = new Hapi.Server(config.hostname, config.port, options);

// routes
server.route([        
    { method: 'GET', path: '/{path*}', handler: {file: './public/app/index.html'} },

	//resource routes
    { method: 'GET', path: '/bower_components/{path*}', handler: { directory: { path: './public/bower_components/' } } },
    { method: 'GET', path: '/resources/{path*}', handler: { directory: { path: './public/resources/' } } }, 
    { method: 'GET', path: '/app/{path*}', handler: { directory: { path: './public/app/' } } },
    { method: 'GET', path: '/img/{path*}', handler: { directory: { path: './public/img/' } } },

    //serve index as entry point into angular app

    //auth routes
    { method: 'POST', path: '/login', config: { handler: authsession.login } },
    
    //responding with 200 rather than 401 because http-auth module logs all 401s
    //and resends the requests after a successful login. ie login failure attempts
    //would be resent if 401 used.
    { method: 'GET', path: '/loginFailure', handler: function(request, reply){
        console.log("login failure. about to reply with a 200 anyway");
        reply({message:"Incorrect username or password"});
    }},
   
    { method: 'GET', path: '/loginSuccess', config: {auth: 'passport'}, handler: function(request, reply){
        console.log("successful login here. about to reply with a 200...");
        reply({loginSuccessful:true});
    }},

    //api routes
    { method: 'POST', path: '/user', handler: authsession.addAccount },

    { method: 'POST', path: '/logout', config: {auth: 'passport'}, handler: authsession.logout},

    { method: 'POST', path: '/requestCode', handler: handlers.requestCode},

    { method: 'POST', path: '/term', config: {auth: 'passport'}, handler: handlers.addTerm},

    { method: 'GET', path: '/termGroups', handler: handlers.getTermGroups},

    { method: 'POST', path: '/termGroups', config: {auth: 'passport'}, handler: handlers.setTermGroups},

    { method: 'POST', path: '/relatedTerms', handler: handlers.relatedTerms},

    { method: 'POST', path: '/newImage', config: {auth: 'passport'}, handler: handlers.addImageFile},

    { method: 'POST', path: '/addContentFromURL', config: {auth: 'passport'}, handler: handlers.addContentFromURL},

    { method: 'POST', path: '/newContent', config: {auth: 'passport'}, handler: handlers.addNewContent},

    { method: 'GET', path: '/termTypeAhead', handler: handlers.termTypeAhead},

    { method: 'POST', path: '/explore', handler: handlers.relatedContent},
   
    { method: 'GET', path: '/contentdata/{uuid}', handler: handlers.getContent},

    { method: 'GET', path: '/content/{uuid}/terms', handler: handlers.getContentTerms},
    
    { method: 'PUT', path: '/content/{uuid}/terms', config: {auth: 'passport'}, handler: handlers.updateContentTerms},

    // { method: 'GET', path: '/content/{uuid}/questions', handler: handlers.getContentAbout},
    // { method: 'GET', path: '/content/{uuid}/facts', handler: handlers.getContentAbout},
    // { method: 'GET', path: '/content/{uuid}/about', handler: handlers.getContentAbout},
    // { method: 'GET', path: '/content/{uuid}/description', handler: handlers.getContentAbout},//?
    // { method: 'GET', path: '/content/{uuid}/value', handler: handlers.getContentAbout},//?
    // { method: 'GET', path: '/content/{uuid}/general', handler: handlers.getContentAbout},//?
    // { method: 'GET', path: '/content/{uuid}/criticisms', handler: handlers.getContentAbout},

    { method: 'GET', path: '/contentAbout', handler: handlers.getContentAbout}, // remove this


]);     

// Start the server
server.start(function () {
    console.log('server started on port: ', server.info.port);
});
