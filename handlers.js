var bcrypt = require('bcrypt'),
	request = require("request"),
    fs = require("fs"),
    neo4j = require('neo4j'),
    db = new neo4j.GraphDatabase('http://localhost:7474');
    Passport = require('Passport');
//auth and sessions

exports.authUser = function (username, password, done) {
    console.log("authUser function here.");
    var properties = { username: username };
    var query = 'MATCH (memberNode:member {name: {username} }) RETURN memberNode.passwordHash AS pass, memberNode.name AS name';

    db.query(query, properties, function (err, userInfo) {
        if (err) {console.log("error in db query: " + err);}
        if(userInfo[0] === undefined){
            console.log("bad username");
            return done(null, false, { message : 'Incorrect username.' });
        }

        console.log(userInfo[0]);

        bcrypt.compare(password, userInfo[0].pass, function(err, res) {
            console.log("bcrypt response: " + res);
            if (err) { return done(err); }
            if (res !== true) {
                console.log("bad password");
                return done(null, false, { message: 'Incorrect password.' });
            }
            return done(null, userInfo);
        });
    });    
};

exports.logout = function (request, reply) {
    console.log('logout here');
    request.session._logOut();
    console.log('logged out');
    reply({message:'logged out'});
};

exports.loggedin = function (request, reply) {
    console.log('checking if logged in...');
    console.log(request.session._isAuthenticated());
    reply({message: request.session._isAuthenticated()});
};

//user specific

exports.addAccount = function (request, reply) {
    //TODO check if username already exists
    var properties = {props: {} };
    properties.props.name = request.payload.data.name;
    properties.props.dateJoined = new Date();
    var query = 'CREATE (memberNode:member:temp { props } )';

    //create hash from supplied password
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(request.payload.data.password, salt, function(err, hash) {
            properties.props.passwordHash = hash;
            // create and store new member node and store info in DB
            db.query(query, properties, function (err, results) {
                if (err) {throw err;}
                //perform login here?
                //ensure they follow through to desired page...
                reply({message: "SUCCESS"});
            });
        });
    });  
};

//other

exports.addTerm = function (request, reply) {

    var properties = {props: {} };
    properties.props.name = request.payload.data.name;
    properties.props.dateJoined = new Date();
    var query = 'CREATE (memberNode:member:init { props } )';

    db.query(query, properties, function (err, results) {
        if (err) {throw err;}
        //perform login here?
        //ensure they follow through to desired page...
        reply({message: "SUCCESS"});
    });

};

exports.relatedTerms = function (request, reply) {
    
    var properties = {props: {} };
    properties.props.name = request.payload.data.name;
    properties.props.dateJoined = new Date();
    var query = 'CREATE (term:init { props } )';

    db.query(query, properties, function (err, results) {
        if (err) {throw err;}
        //perform login here?
        //ensure they follow through to desired page...
        reply({message: "SUCCESS"});
    });
};
