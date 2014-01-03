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
Passport.use(new LocalStrategy( handlers.authUser ) );

    //for sessions
Passport.serializeUser(function(user, done) {
  done(null, user.id);
});

Passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
// The serialization and deserialization logic is supplied by the application, allowing the application to choose an appropriate database and/or object mapper, without imposition by the authentication layer.

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
    { method: 'GET', path: '/user/{id}', handler: handlers.authUser },
    { method: 'POST', path: '/user', handler: handlers.addAccount },

    { method: 'POST', path: '/login', config: {
            handler: function (request) {

                console.log("/login handler here.");
    
                Passport.authenticate('local')(request, function (err) {

                    console.log("request after authentication");
    
                    if (err && err.isBoom) {
                        console.log("error and error is boom...");
                        // This would be a good place to flash error message
                    }
                    //send what is missing to user (if incorrect)?
                    return request.reply();
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
