var Hapi = require('hapi');

// Create a server
var server = new Hapi.Server('localhost', 8080);

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
server.start();
