var bcrypt = require('bcrypt'),
	request = require("request"),
    fs = require("fs"),
    neo4j = require('neo4j'),
    db = new neo4j.GraphDatabase('http://localhost:7474'),
    Passport = require('Passport'),
    freebase = require('freebase'),
    async = require('async');


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

        console.log("User info: " + userInfo[0]);

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
                //ensure they follow through to desired page...?
                //navigate to introduction page?
                reply({message: "SUCCESS"});
            });
        });
    });  
};

//other

exports.addTerm = function (request, reply) {


    // freebase.sentence("Humanities", {type:"/common/topic"}, function(result){
    //     console.log("result: " + result);
    // });
    var MID = "/m/01_0z4";
    
    var freebasQuery={
          "mid": MID,
          "type": "/common/topic",
          "name": [{}]
        };

    var properties = {
            "coreProps" : {
                "MID": MID,
                "dateAdded": new Date(),
                "addedBy" : "someones UUID",
                // "languageAddedIn" : request.session.user.lang,
            },
            "metaProps" : []
        };

    var query = "CREATE (newTerm:term:test {coreProps}) FOREACH ( props IN {metaProps} | CREATE newTerm-[:HAS_META {languageCode: props.languageCode}]->(:termMeta:test {name: props.name, dateAdded: props.dateAdded})) WITH newTerm MATCH newTerm-[rel:HAS_META]->(metaNode:test:termMeta) RETURN newTerm, rel, metaNode";

    async.series([
        
        //check if term is already in database (search by MID?)
            //TODO
            //callback(true); to stop series execution

        //MQL query for termMeta, build meta from results
        function(callback){
            freebase.mqlread(freebasQuery, {key:"AIzaSyCrHUlKm60rk271WLK58cZJxEnzqNwVCw4"}, function(result){
                for(var ii = 0; ii<result.result.name.length; ii++){
                    console.log("language: " + result.result.name[ii].lang);
                    console.log("word: " + result.result.name[ii].value);
        
                    var metaProp = {
                        languageCode: result.result.name[ii].lang.substr(6,result.result.name[ii].lang.length),
                        name: result.result.name[ii].value,
                        dateAdded: new Date()
                    };
        
                    properties.metaProps.push(metaProp);
                }
        
                console.log(properties);
    
                console.log("done with freebase");
                callback();   
    
        
            });
        },
        
        //add term AND respective term meta in all avaialble languages on freebase
        function(callback){
            db.query(query, properties, function (err, results) {
                if (err) {console.log("error: " + err);}
                console.log("results: " + results);
                reply({message: "SUCCESS"});
                console.log("done with noe4j");
                callback();
            });
        }

    ]);

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
