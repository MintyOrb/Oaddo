/*global console, angular, setTimeout, window, FileReader, $ */
'use strict';

angular.module('universalLibrary').

controller('addingContentCtrl', ['$scope', 'contentTerms', 'appLanguage', '$http', function ($scope, contentTerms, appLanguage, $http) {

    $scope.contentObject = {
        language: appLanguage.lang,
        // source: {
        //     link: "",
        //     description: "",
        //     text: ""
        // },
        // publisher: {
        //     link: "",
        //     description: "",
        //     text: ""
        // },
        // links: [], //array of objects with url, description
        // description: "",
        savedAs: "",
        fileSystemID: "",
        displayType: "",
        embedSrc: "",
        webURL: "",
        assignedTerms: contentTerms.selected
    };

    $scope.submitNewContent = function(){
        // TODO: validate that necessary fields are filled out before POSTing
        $http.post('/newContent', $scope.contentObject).
        success(function(response){
            console.log(response);
            // redirect to content page
        });
    };
    
}]).













controller("fileSelectionCtrl", function ($timeout, $scope, $http, $upload, appLanguage){

    $scope.displaySettings = {
        fileSelected : false,
        imageURLPresent : false,
        dataUrl : [],
        optionSelected : false,
        disableFileSelection : false,
        uploadNonImage : false,
    };

    $scope.onFileSelect = function(file) {

        //only allow image files
        if (file[0].type.indexOf('image') === -1) {
            $scope.displaySettings.uploadNonImage = true;
        } else {

            $scope.displaySettings.uploadNonImage = false; //hide error message if shown

            //get data for displaying image preview
            if (window.FileReader) {
                var fileReader = new FileReader();
                fileReader.readAsDataURL(file[0]);
                fileReader.onload = function(e) {
                    $timeout(function() {
                        $scope.displaySettings.dataUrl.image = e.target.result;
                    });
                };
            }    

            $scope.displaySettings.optionSelected = true;   //display cancel button
            $scope.displaySettings.fileSelected = true;     //display image preview and selected file name
            $scope.displaySettings.fileName = file[0].name; //place file name in exposed input

            $upload.upload({
                url: '/newImage',
                file: file[0],
                data: {name: file[0].name, language: appLanguage.lang},
                progress: function(evt){
                //TODO show upload progress to user
                    console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
                }
            }).then(function(response, status, headers, config) {
                $scope.contentObject.savedAs = response.data.savedAs;
                $scope.contentObject.fileSystemID = response.data.id;
                $scope.contentObject.displayType = response.data.displayType;
                console.log("$scope.contentObject: " + JSON.stringify($scope.contentObject));
                console.log("it worked: " + JSON.stringify(response));
            }); 
        }
    };

    $scope.onURLChange = function () {
        
        $scope.displaySettings.uploadNonImage = false; //hide error message if inputting a URL

        if($scope.addContentForm.pasteURL.$valid && $scope.contentObject.webURL.length > 0){

            $scope.displaySettings.optionSelected = true;  //display cancel button
            $scope.displaySettings.disableFileSelection = true;

            $http.post('/addContentFromURL', {url: $scope.contentObject.webURL, language: appLanguage.lang}).
            success(function(response){

                if(response.displayType === "image" || response.displayType === "website"){

                    if(response.displayType === "image"){
                        $scope.displaySettings.imageURLPresent = true; //display preivew of linked image
                    }

                    $scope.contentObject.savedAs = response.savedAs;
                    $scope.contentObject.fileSystemID = response.id;

                } else if(response.displayType === "embed"){
                    $scope.contentObject.embedSrc = response.embedSrc;
                }

                $scope.contentObject.displayType = response.displayType;

            });
        }
    };

    $scope.reset = function(){
        $scope.displaySettings = {
            fileSelected : false,
            imageURLPresent : false,
            dataUrl : {},
            optionSelected : false,
            disableFileSelection : false,
            uploadNonImage : false,
        };
        $scope.contentObject.savedAs = "";
        $scope.contentObject.fileSystemID = "";
        $scope.contentObject.displayType = "";
        $scope.contentObject.embedSrc = "";
        $scope.contentObject.webURL = "";
    };
}).




















controller("termSelectionCtrl", function ($scope, contentTerms, $http, appLanguage, $modal, filterFactory) {

    $scope.contentTerms = contentTerms;
    $scope.DBTerm = "";
    $scope.typeAhead = [];
    $scope.displayOptions = {
        addingNewTerm : false // display freebase input or dbinput depending
    };

    $scope.filter = filterFactory;
    $scope.filter.setAll(true);  // initialize filter values to true (include all types)

    var getRelatedTerms = function(){
        // clear current related
        // TODO: only remove terms that are not again returned? (prevent term from vanishing only to re-appear)
        $scope.contentTerms.related = [];

        // NOTE: dropping term from search into search leads to multiple instances of terms being returned
        // this should be fixed with correct term drop logic (restricting drop zones)
        $http.post('/relatedTerms', { 
            selectedTerms: $scope.contentTerms.selected,
            keyTerms: $scope.contentTerms.search,
            type: $scope.filter,
            language: appLanguage.lang }).
        success(function(data){
            console.log("data: " + JSON.stringify(data));
            for (var i = 0; i < data.results.length; i++) {
                $scope.contentTerms.related.push(data.results[i]);
            }
        });
    };

    // fetch terms related when search term array or filter options change
    $scope.$watchCollection("contentTerms.search", function(){
        if(contentTerms.selected.length > 0){
            getRelatedTerms();
            console.log("triggered selected: " );
        }    
    });

    // NOTE: is there a better solution to getting terms on filter change?
    //  maybe keep an array of all the values and watch that instead?
    $scope.$watchCollection("[filter.people.included,filter.organizations.included,filter.physicalObjects.included,filter.concepts.included,filter.jargon.included,filter.disciplines.included,filter.activities.included,filter.locations.included,filter.contentTypes.included,filter.people.included]", function(){
        console.log("triggered: ");
        getRelatedTerms();
    });

    //typeahead from neo4j
    $scope.findTerm = function()
    {   
        $http.get('/termTypeAhead', { params: { entered: $scope.DBTerm, language: appLanguage.lang } }).
        success(function(response){
            $scope.typeAhead = response.matches;
        }).
        error(function(data){
            console.log("type ahead error: "+ JSON.stringify(data));
        });        
    };

    $scope.addToSelectedFromDB = function(){
        contentTerms.selected.push({name:$scope.DBTerm.name,UUID:$scope.DBTerm.UUID});
        $scope.DBTerm = "";
        console.log("selected: " + JSON.stringify(contentTerms.selected));
    };

    $scope.openNewTermModal = function (termData) {
        // $scope.newTermMeta.name = termData.name;
        var test = termData;
        console.log("termMeta: " + JSON.stringify(termData));
        var modalInstance = $modal.open({
            templateUrl: 'app/addingContent/newTermModal.html',
            controller: 'newTermModalInstanceCtrl',
            windowClass: "",
            resolve: {
                data: function () {
                    return termData;
                }
            }
        });
    };

    $scope.dropFromHandler = function(index, termArray){
        console.log("DROPPING");
        console.log("termArray: " + termArray);
        console.log("index: " + index);
        termArray.splice(index, 1);
    };

    $scope.recievingHandler = function(data, termArray){
        console.log("RECIEVING");
        console.log("data: " + data);
        console.log("termArray: " + termArray);
        termArray.push(data);
    };

}).


controller('newTermModalInstanceCtrl' , function ($scope, $modalInstance, data, contentTerms, $http) {

    console.log("data in modal: " + JSON.stringify(data));

    $scope.newTermMeta = {};

    $scope.newTermMeta.type = {
        people: {
            included: false,
            name: 'person',
        },
        organizations: {
            included: false,
            name: 'organization',
        },
        physicalObjects: {
            included: false,
            name: 'physical object',
        },
        concepts: {
            included: false,
            name: 'concept',
        },
        jargon: {
            included: false,
            name: 'jargon',
        },
        disciplines: {
            included: false,
            name: 'discipline',
        },
        activities: {
            included: false,
            name: 'activity',
        },
        locations: {
            included: false,
            name: 'location',
        },
        contentTypes: {
            included: false,
            name: 'content type',
        }
    };

    $scope.newTermMeta.name = data.name;
    $scope.newTermMeta.mid = data.mid; 
    $scope.newTermMeta.lang = data.lang;
    console.log("data.lang: " + data.lang);
       
    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

    $scope.addToSelectedFromFB = function(){
        //add to array to prevent visual delay
        console.log("lang from newtermmeta: " + $scope.newTermMeta.lang);
        contentTerms.selected.push({
            mid: $scope.newTermMeta.mid,
            name: $scope.newTermMeta.name,
            langAddedIn: $scope.newTermMeta.lang,
            definition: $scope.newTermMeta.definition
        });
        //add to database (if not already stored) and return UUID
        $modalInstance.close();

        $http.post('/term', $scope.newTermMeta)
        .success(function(returned){
            //add UUID to item in selected
            for(var index = 0; index < contentTerms.selected.length; index++){
                if(contentTerms.selected[index].mid === $scope.newTermMeta.mid){
                    contentTerms.selected[index].UUID = returned.UUID;
                }
            }
            console.log("data: " + JSON.stringify(returned));
        });
        console.log("selected: " + JSON.stringify(contentTerms.selected));
    };  

    //modal close
    $modalInstance.result.then(function () {
        console.log('Modal success at:' + new Date());
    }, function (reason) {
        console.log('Modal dismissed at: ' + new Date());
        console.log('Reason Closed: ' + reason);
    });
}).


// TODO: add ng-model support for suggest input (bind it to other input and clear after a term has been added)
directive('suggest', function() {
    return {
        restrict: 'E',
        template: "<input style='background: url(img/fbIcon.png); background-position: 140px 6px; background-repeat: no-repeat;' type='text'>",
        replace:true,
        scope:{onSelect:'&'},
        link: function(scope, element, attrs) {
            attrs.$observe('lang', function(value) {
                $(element).suggest({
                    lang: value,
                    key: "AIzaSyCrHUlKm60rk271WLK58cZJxEnzqNwVCw4"
                })
                .unbind("fb-select")
                .bind("fb-select", function(e, info) { 
                    console.log(info);
                    scope.$apply(
                        scope.onSelect({data:info})
                    );
                });
            });
        }
    };
});