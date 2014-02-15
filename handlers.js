var bcrypt = require('bcrypt'),
	requestModule = require("request"),
    fs = require("fs"),
    neo4j = require('neo4j'),
    db = new neo4j.GraphDatabase('http://localhost:7474'),
    freebase = require('freebase'),
    async = require('async'),
    uuid = require('node-uuid'),
    webshot = require('webshot');


//auth and sessions

exports.authUser = function (username, password, done) {

    console.log("authUser function here.");
    var properties = { username: username };
    var query = 'MATCH (memberNode:member {primaryEmail: {username} }) RETURN memberNode.passwordHash AS pass, memberNode.UUID AS id';

    db.query(query, properties, function (err, userInfo) {
        if (err) {console.log("error in db query: " + err);}
        console.log("returned from db: " + JSON.stringify(userInfo));
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

//new user
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
            console.log('about to check if name or email exists in db already');
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
                console.log("created user in db, about to reply wiht success");
                reply({successfulCreation: true});
                callback(true);
            });
        }
    ]);
   
};

exports.relatedTerms = function (request, reply) {
    
    var properties = {props: {} };
    // var query = 'CREATE (term:init { props } )';

    db.query(query, properties, function (err, results) {
        if (err) {throw err;}
        
        reply({message: "SUCCESS"});
    });
};

//new terms
exports.addTerm = function (request, reply) {

    // TODO: figure out how to handle def in case en/en-gb - remove region specification (gb)?
    
    console.log("req.payload: " + JSON.stringify(request.payload));
    console.log("req.session: " + JSON.stringify(request.session));
    console.log("req.user: " + JSON.stringify(request.user));
    
    var UUID = uuid.v4(); // Unique ID for term being added

    // used to get term name in as many languages as possible
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
                "UUID": UUID,
                "languageAddedIn" : request.payload.lang,
            },
            "metaProps" : [], // array of objects (created below)
        };

    var termTypeProperties = { 
        termUUID: UUID,
        types: [] 
    };


    // generate array of term type names
    for (var type in request.payload.type) {
        if(request.payload.type[type].included) {
            termTypeProperties.types.push(request.payload.type[type].name);
        }
    }
    console.log("types: " + JSON.stringify(termTypeProperties.types));


    var metaProp = {}; // for storing result of MQL query (will be pushed to createProperties.metaProps)
    var defMeta = "";  // for adding definition provided in adders language

    var createQuery = "CREATE (newTerm:term:testTerm {coreProps}) FOREACH ( props IN {metaProps} | CREATE newTerm-[:HAS_LANGUAGE {languageCode: props.languageCode}]->(:termMeta:testMeta {name: props.name, dateAdded: props.dateAdded, definition: props.definition}) )"; // use if returning data from query: WITH newTerm MATCH newTerm-[rel:HAS_META]->(metaNode:test:termMeta) RETURN newTerm, rel, metaNode";
    
    var connectTypesQuery = "MATCH (typeNode:termType), (termNode:term {UUID: {termUUID} }) WHERE typeNode.name IN {types} CREATE (typeNode)<-[:IS_TYPE]-(termNode) RETURN typeNode, termNode";

    var checkProperties = {mid: request.payload.mid};

    // used to see if term is already in the database
    var checkQuery = "MATCH (node:term {MID: {mid} }) RETURN node.UUID as UUID";
    
    async.series([
        
        // check if term is already in database (search by MID)
        function(callback){
            db.query(checkQuery, checkProperties, function (err, results) {
                if (err) {console.log("error performing db query: " + err);}
                if (results[0] === undefined){
                    console.log("not in DB");
                    callback();
                } else{
                    console.log("term already in  db");
                    console.log("results: " + JSON.stringify(results));

                    reply({newTerm: false, UUID: results[0].UUID});
                    callback(true); // if already found, stop execution of functions
                }
            });
        },

        // MQL query for termMeta, build meta from results
        function(callback){
            freebase.mqlread(freebasQuery, {key:"AIzaSyCrHUlKm60rk271WLK58cZJxEnzqNwVCw4"}, function(result){
                // for each language found, add name to metaProp
                for(var ii = 0; ii<result.result.name.length; ii++){
                    console.log("submit lang: " + request.payload.lang);
                    console.log("language: " + result.result.name[ii].lang);
                    console.log("word: " + result.result.name[ii].value);
        
                    // add def to termMeta of correct language
                    if(result.result.name[ii].lang.substr(6,result.result.name[ii].lang.length) === request.payload.lang){
                        console.log("match found: ");
                        defMeta = request.payload.definition || "";
                    }
                    metaProp = {
                        languageCode: result.result.name[ii].lang.substr(6,result.result.name[ii].lang.length), //get rid of "/lang/"
                        name: result.result.name[ii].value,
                        dateAdded: new Date(),
                        definition: defMeta
                    };
        
                    createProperties.metaProps.push(metaProp);
                    defMeta = ""; // reset def so it is not added in incorrect languages
                }
                console.log(createProperties);
                console.log("done with freebase");
                callback();   
            });
        },
        
        //add term and respective term meta in all avaialble languages on freebase to graph, return UUID
        function(callback){
            db.query(createQuery, createProperties, function (err, results) {
                if (err) {console.log("neo4j error: " + err);}
                console.log("create results: " + results);
                callback();
            });
        },
        //add relationships to relevant term types
        function(callback){
            db.query(connectTypesQuery, termTypeProperties, function (err, results) {
                if (err) {console.log("neo4j error: " + err);}
                console.log("results: " + results);
                console.log("done with neo4j connect type");
                reply({newTerm: true, UUID: UUID});
                callback();
                
            });
        }
    ]);

};

//new content
exports.addContentFromURL = function (request, reply){  

    console.log(request.payload);
    var identifier = '-noAccociatedContent-';           // to be removed when associated content is added to db.
    var ext = request.payload.url.split('.').pop();     // get extension from orignal filename
    var generatedName = uuid.v1();                      // is uuid the best option for file names?
    var lang = "_" + request.payload.language + "_";    // allows for adding same content in different languages

    var embedURL = ""; // for setting embedded video source urls

    //get response header to determine type of url
    requestModule.head({uri:request.payload.url}, function (error, response) {
        if(error){console.log("error on head request: " + error);}

            console.log("uri: " + JSON.stringify(response.request.uri));


        if(response.statusCode !== 200){
            //TODO: handle non 200 responsee - what is the best way?
        } else if (response.headers['content-type'].indexOf('image') > -1){
            //NOTE: is it necessary to wait to make sure the stream was successful? (with req.on('end', function () {}) )
            //stream image to server
            requestModule(request.payload.url).pipe(fs.createWriteStream("./img/submittedContent/" + identifier + lang + generatedName + '.' + ext));
            reply({displayType: "image", savedAs: identifier + lang + generatedName + '.' + ext, id: generatedName});
        } else {
            // determine if video and host
            // NOTE: is this the best way to make the source determination?
            // TODO: incorporate youtube, vimeo, and TED (when available) apis to get thumbnail images
            if(response.request.uri.host.indexOf('ted.com') > -1){
                //embed - //embed.ted.com/talks/:id
                embedURL = "//embed.ted.com";
                embedURL += response.request.uri.path;
                console.log("ted embed: " + embedURL);
                reply({embedSrc: embedURL, displayType: "embed"});
            } else if(response.request.uri.host.indexOf('vimeo.com') > -1){
                //embed - //www.player.vimeo.com/video/:id
                embedURL = "//player.vimeo.com/video";
                embedURL += response.request.uri.path;
                console.log("vimeo embed: " + embedURL);
                reply({embedSrc: embedURL, displayType: "embed"});
            } else if(response.request.uri.host.indexOf('youtube.com') > -1){
                //embed - //www.youtube.com/embed/:id
                embedURL = "//www.youtube.com/embed/";
                embedURL += response.request.uri.path.slice(9,-1);
                //remove extra parameters (e.g. if pasted from playlist url will contain '&LIST=XXX')
                if(embedURL.indexOf('&') > -1){
                    var position = embedURL.indexOf('&');
                    embedURL = embedURL.substring(position, -1);
                }
                console.log("vimeo embed: " + embedURL);
                reply({embedSrc: embedURL, displayType: "embed"});
            } else {
                //TODO: send screenshot back to user for preivew
                //take screenshot of webpage that is not a video
                webshot(request.payload.url, './img/submittedContent/' + identifier + lang + generatedName + '.png',function(err) {
                    if(err){console.log("error taking webshot: " + err);}
                    console.log("screenshot now saved");
                    reply({displayType: "webpage", savedAs: identifier + lang + generatedName + '.png', id: generatedName});

                });
            }
        } 
    });
};

exports.addImageFile = function (request, reply){

    //TODO: look into saving into S3 buckets?
    //TODO: validate incoming file is an image
    //TODO: look into converting gifs to html5 videos (gfycat...)
    var identifier = '-noAccociatedContent-';           //to be removed when associated content is added to db.
    var ext = request.payload.name.split('.').pop();    //get extension from orignal filename
    var generatedName = uuid.v1();                      //NOTE: is uuid the best option for unique file names?
    var lang = "_" + request.payload.language + "_";    //allows for adding same content in different languages (keep same UUID)

    fs.writeFile("./img/submittedContent/" + identifier + lang + generatedName + '.' + ext, request.payload.file, function (err) {
        if(err){console.log("error saving: " + err);}
        //return generated name and full name
        reply({displayType:"image", savedAs:identifier + lang + generatedName + '.' + ext, id: generatedName});
    });
};

exports.addContent = function (request, reply){
    // fs.rename(oldPath, newPath, callback) // for deleting identifier

    //query for creating the content

    //remove identifier

    //query for adding terms

    //redirect to content page....
};


exports.termTypeAhead = function (request, reply){
    console.log("data: "+ request.query);
    console.log("data: "+ JSON.stringify(request.query));

    var properties = { 
        code: request.query.language,
        match: '(?i).*' + request.query.entered + '.*'
     };
    //TODO: use english as default if not found in preferred language
    //TODO: use users secondary languge choice if first not found?
    var query = "MATCH (core:term)-[r:HAS_META {languageCode:{code}}]-(langNode) WHERE langNode.name =~ {match} RETURN core.UUID as UUID, langNode.name as name LIMIT 5";
    console.log("match: " + properties.match);
    console.log("lang: " + properties.code);

    db.query(query, properties, function (err, matches) {
        if (err) {console.log("error in db query: " + err);}
        console.log("returned from db: " + JSON.stringify(matches));
        if(matches[0] === undefined){
            console.log("none found: " + JSON.stringify(matches));
            reply({ message : 'heh' });
        } else {
            reply({matches:matches});
        }

        

    });    
};

