var bcrypt = require('bcrypt'),
	requestModule = require("request"),
    fs = require("fs"),
    neo4j = require('neo4j'),
    db = new neo4j.GraphDatabase('http://localhost:7474'),
    freebase = require('freebase'),
    async = require('async'),
    uuid = require('node-uuid');


//auth and sessions

exports.authUser = function (username, password, done) {

    console.log("authUser function here.");
    var properties = { username: username };
    var query = 'MATCH (memberNode:member {primaryEmail: {username} }) RETURN memberNode.passwordHash AS pass, memberNode.UUID AS id';

    db.query(query, properties, function (err, userInfo) {
        if (err) {console.log("error in db query: " + err);}
        if(userInfo[0] === undefined){
            console.log("bad username: " + JSON.stringify(userInfo));
            return done(null, false, { message : 'Incorrect username.' });
        }

        console.log("User info: " + JSON.stringify(userInfo[0]));

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

    console.log('checking if logged in: ' + request.session._isAuthenticated());
    reply({message: request.session._isAuthenticated()});
};

//user specific

exports.addAccount = function (request, reply) {

    console.log("add account here.");

    var createProperties = {props: {} };
    createProperties.props.primaryEmail = request.payload.name;
    createProperties.props.dateJoined = new Date();
    createProperties.props.UUID = uuid.v4();
    var createQuery = 'CREATE (memberNode:member:temp { props } )';
    
    var checkProperites = {email: request.payload.name};
    var checkQuery = 'MATCH (memberNode:member:temp { primaryEmail: {email} } ) RETURN memberNode.primaryEmail as email';


    async.series([

        //check if email already exists
        function(callback){
            console.log('about to check if anem exists in db already');
            db.query(checkQuery, checkProperites, function (err, results) {
                if (err) {console.log("error: " + err);}
                if (results[0] === undefined){
                    console.log("name not found- going to create it...");
                    callback();
                } else{
                    console.log('name found already...');
                    reply({message: "Email/name address already registered."});
                    callback(true); //passing 'true' stops async series execution
                }
            });
        },

        //create hash from supplied password
        function(callback){
            console.log('about to make hash');
            bcrypt.genSalt(10, function(err, salt) {
                bcrypt.hash(request.payload.password, salt, function(err, hash) {
                    createProperties.props.passwordHash = hash;
                    console.log('hash created');
                    callback();
                });
            });
        },

        //create and store new member node in DB
        function(callback){
            console.log('about to save user to db');
            db.query(createQuery, createProperties, function (err, results) {
                if (err) {throw err;}
                //perform login here?
                //ensure they follow through to desired page...?
                //navigate to introduction page?
                console.log("created user in db, about to reply wiht success");
                reply({message: "SUCCESS"});
                callback(true);
            });
        }
    ]);
   
};

//content and terms

exports.addTerm = function (request, reply) {

    
    console.log("req.payload: " + JSON.stringify(request.payload));
    console.log("req.session: " + JSON.stringify(request.session));
    console.log("req.user: " + JSON.stringify(request.user));
    
    var freebasQuery={
          "mid": request.payload.mid,
          "type": "/common/topic",
          "name": [{}]
        };

    var createProperties = {
            "coreProps" : {
                "MID": request.payload.mid,
                "dateAdded": new Date(),
                "addedBy" : request.user.id,
                "UUID": uuid.v4(),
                "languageAddedIn" : request.payload.langAddedIn
            },
            "metaProps" : []
        };
    var createQuery = "CREATE (newTerm:term:test {coreProps}) FOREACH ( props IN {metaProps} | CREATE newTerm-[:HAS_META {languageCode: props.languageCode}]->(:termMeta:test {name: props.name, dateAdded: props.dateAdded})) WITH newTerm MATCH newTerm-[rel:HAS_META]->(metaNode:test:termMeta) RETURN newTerm, rel, metaNode";
    
    var checkProperites = {mid: request.payload.mid};
    var checkQuery = "MATCH (node:term {MID: {mid} }) RETURN node.UUID as UUID";
    
    async.series([
        
        //check if term is already in database (search by MID)
        function(callback){
            db.query(checkQuery, checkProperites, function (err, results) {
                if (err) {console.log("error performing db query: " + err);}
                if (results[0] === undefined){
                    console.log("not in DB");
                    callback();
                } else{
                    console.log("term already in  db");
                    console.log("results: " + JSON.stringify(results));

                    reply({newTerm: false, UUID: results[0].UUID});
                    callback(true);
                }
            });
        },

        //MQL query for termMeta, build meta from results
        function(callback){
            freebase.mqlread(freebasQuery, {key:"AIzaSyCrHUlKm60rk271WLK58cZJxEnzqNwVCw4"}, function(result){
                for(var ii = 0; ii<result.result.name.length; ii++){
                    console.log("language: " + result.result.name[ii].lang);
                    console.log("word: " + result.result.name[ii].value);
        
                    var metaProp = {
                        languageCode: result.result.name[ii].lang.substr(6,result.result.name[ii].lang.length), //get rid of "/lang/"
                        name: result.result.name[ii].value,
                        dateAdded: new Date()
                    };
        
                    createProperties.metaProps.push(metaProp);
                }
                console.log(createProperties);
                console.log("done with freebase");
                callback();   
            });
        },
        
        //add term AND respective term meta in all avaialble languages on freebase
        function(callback){
            db.query(createQuery, createProperties, function (err, results) {
                if (err) {console.log("error: " + err);}
                console.log("results: " + results);
                reply({newTerm: true, UUID: createProperties.coreProps.UUID});
                console.log("done with noe4j");
                callback();
            });
        }

    ]);

};

exports.relatedTerms = function (request, reply) {
    
    var properties = {props: {} };
    //var query = 'CREATE (term:init { props } )';

    db.query(query, properties, function (err, results) {
        if (err) {throw err;}
        
        reply({message: "SUCCESS"});
    });
};


// from orig code:
// exports.addImage = function (req,res) {
//     var url = req.query.url;
//     var fileName = req.query.fileName;

//     console.log(req.query);
//     request(url).pipe(fs.createWriteStream("./img/submittedContent/" + fileName));

//     //what is res.send doing here...is there a better way of sending confirmation?
//     res.send();
// }
exports.validateURL = function (request, reply){  
    console.log("hi " + JSON.stringify(request.payload));
    requestModule.head({uri:request.payload.url}, function (error, response) {
            if(error){console.log("error on head request: " + error);}
            console.log("made it through request...");
            console.log((response));
    });

};

exports.addContent = function (request, reply){  
};

exports.addImage = function (request, reply){
    console.log("about to write file");
    //request.payload.name.split('.').pop();
    fs.writeFile("./img/submittedContent/" + request.payload.name, request.payload.file, function (err) {
        if(err){console.log("error saving: " + err);}
        reply({test:"saved image"});
    });
};