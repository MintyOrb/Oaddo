//auth and sessions
var bcrypt = require('bcrypt'),
    neo4j = require('neo4j'),
    db = new neo4j.GraphDatabase(process.env.GRAPHENEDB_URL || 'http://localhost:7474'),
    uuid = require('node-uuid'),
    async = require('async'),
    LocalStrategy = require('passport-local').Strategy,
    server = require('./server');


// TODO: switch to hawk (holder-of-key) or hapi-auth-basic or hapi-auth-cookie for auth? - just move away from passport...
// TODO: add hapi Bell for third-party login
server.s.auth.strategy('passport', 'passport');
//setup auth
var Passport = server.s.plugins.travelogue.passport;

Passport.use(new LocalStrategy( authUser ) );

    //for sessions
Passport.serializeUser(function(user, done) {
    done(null, user);
});

Passport.deserializeUser(function (obj, done) {
    done(null, obj);
});


var authUser = function (email, password, done) {
    
    var properties = { email: email };
    var query = 'MATCH (memberNode:member {primaryEmail: {email} }) RETURN memberNode.passwordHash AS pass, memberNode.UUID AS id';

    db.query(query, properties, function (err, userInfo) {
        if (err) {console.log("error in db query: " + err);}
        if(userInfo[0] === undefined){
            return done(null, false, { message : 'Incorrect email.' });// message does not work
        }

        bcrypt.compare(password, userInfo[0].pass, function(err, res) {
            if (err) { return done(err); }
            if (res !== true) {
                return done(null, false, { message: 'Incorrect password.' });// message does not work
            }
            return done(null, userInfo);
        });
    });    
};

exports.login = function (request, reply) {

    console.log("/login handler here.");

    Passport.authenticate('local', {
        successRedirect: config.urls.successRedirect,
        failureRedirect: config.urls.failureRedirect
    })(request, reply);
};


var authUser = function (email, password, done) {
    
    var properties = { email: email };
    var query = 'MATCH (memberNode:member {primaryEmail: {email} }) RETURN memberNode.passwordHash AS pass, memberNode.UUID AS id';

    db.query(query, properties, function (err, userInfo) {
        if (err) {console.log("error in db query: " + err);}
        if(userInfo[0] === undefined){
            return done(null, false, { message : 'Incorrect email.' });// message does not work
        }

        bcrypt.compare(password, userInfo[0].pass, function(err, res) {
            if (err) { return done(err); }
            if (res !== true) {
                return done(null, false, { message: 'Incorrect password.' });// message does not work
            }
            return done(null, userInfo);
        });
    });    
};

exports.logout = function (request, reply) {
    request.session._logOut();
    reply({message:'logged out'});
};

//new user
exports.addAccount = function (request, reply) {

    var createProperties = {
        props: {
            primaryEmail : request.payload.email,
            dateJoined : new Date(),
            UUID : uuid.v4(),
            codeUsed : request.payload.code
        } 
    };
    var createQuery = 'CREATE (memberNode:member:temp { props } )';
    
    var codeProp = {code: request.payload.code};
    var codeQuery = "MATCH (n:codeNode {code: {code} }) SET n.count = n.count + 1 RETURN n";

    var checkProperites = {email: request.payload.email};
    var checkQuery = 'MATCH (memberNode:member:temp { primaryEmail: {email} } ) RETURN memberNode.primaryEmail as email';

    async.series([

        //check if email already exists
        function(callback){
            db.query(checkQuery, checkProperites, function (err, results) {
                if (err) {console.log("error: " + err);}
                if (results[0] === undefined){
                    callback();
                } else{
                    reply({message: "email address already registered."});
                    callback(true); //passing 'true' stops async series execution
                }
            });
        },

        //check if code is valid
        function(callback){
            db.query(codeQuery, codeProp, function (err, results) {
                if (err) {console.log("error: " + err);}
                if (results[0] === undefined){ // reply with error if code is not found
                    reply({message: "code not recognized."});
                    callback(true);
                } else{
                    callback();
                }
            });
        },

        //create hash from supplied password
        function(callback){
            bcrypt.genSalt(10, function(err, salt) {
                bcrypt.hash(request.payload.password, salt, function(err, hash) {
                    createProperties.props.passwordHash = hash;
                    callback();
                });
            });
        },

        //create and store new member node in DB
        function(callback){
            db.query(createQuery, createProperties, function (err, results) {
                if (err) {throw err;}
                reply({successfulCreation: true});
                callback(true);
            });
        }
    ]);
   
};
