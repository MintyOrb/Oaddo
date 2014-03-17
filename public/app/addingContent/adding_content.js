/*global console, angular, setTimeout, window, FileReader, $ */
'use strict';

angular.module('universalLibrary').

controller('addingContentCtrl', ['$location', '$scope', 'contentTerms', 'appLanguage', '$http', function ($location, $scope, contentTerms, appLanguage, $http) {
    
    $scope.contentTerms = contentTerms;
    contentTerms.matchAll = false;
    contentTerms.emptyAll(); 

    $scope.tab = {
        description: false,
        value: false,
        terms: true
    };

    $scope.imageDisplaySettings = {
        fileSelected : false,
        imageURLPresent : false,
        dataUrl : []
    };
    $scope.displaySettings = {
        fileName: "",
        optionSelected : false,
        disableFileSelection : false,
        uploadNonImage : false,
        webShotURL: false
    };

    $scope.contentObject = {
        language: appLanguage.lang,
        // language specific
        meta: {
            // source: {
            //     url: "",
            //     text: ""
            // },
            // takeAway: "",
            value: "",
            description: "",
            title: ""
        },
        // for all
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
            $location.path('/content/' + response.UUID);
            $scope.reset();
        });
    };

    $scope.reset = function(){
        console.log("resetting: " );
        $scope.displaySettings = {
            fileName: "",
            optionSelected : false,
            disableFileSelection : false,
            uploadNonImage : false,
            webShotURL : false
        };
        $scope.imageDisplaySettings = {
            fileSelected : false,
            imageURLPresent : false,
            dataUrl : {}
        };
        $scope.contentObject.savedAs = "";
        $scope.contentObject.fileSystemID = "";
        $scope.contentObject.displayType = "";
        $scope.contentObject.embedSrc = "";
        $scope.contentObject.webURL = "";
        contentTerms.selected = [];
        contentTerms.discarded = [];    
        contentTerms.related = [];      
        contentTerms.search = [];       
    };
    
}]).













controller("fileSelectionCtrl", function ($timeout, $scope, $http, $upload, appLanguage){


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
                        $scope.imageDisplaySettings.dataUrl.image = e.target.result;
                    });
                };
            }    

            $scope.imageDisplaySettings.fileSelected = true;  //display image preview and selected file name
            $scope.displaySettings.optionSelected = true;     //display cancel button
            $scope.displaySettings.fileName = file[0].name;   //place file name in exposed input

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

                if(response.displayType === "image"){
                    $scope.imageDisplaySettings.imageURLPresent = true; //display preivew of linked image
                }
                if(response.displayType === "webpage"){
                    $scope.imageDisplaySettings.webShotURL = true;
                }
                $scope.contentObject.savedAs = response.savedAs;
                $scope.contentObject.embedSrc = response.embedSrc;
                $scope.contentObject.fileSystemID = response.id;
                $scope.contentObject.displayType = response.displayType;

            });
        }
    };

}).















controller("termTypeAheadCtrl", function ($scope, focus, $modal, $http, $route, appLanguage, contentTerms) {

    $scope.displayOptions = {
        DBTerm : "",
        addingNewTerm : false // display freebase input or dbinput depending
    };

    //typeahead from neo4j
    $scope.findTerm = function()
    {   
        return $http.get('/termTypeAhead', { params: { entered: $scope.displayOptions.DBTerm, language: appLanguage.lang } }).
        then(function(response){
            if(!response.data.results){
                if($route.current.templateUrl === "app/addingContent/newContent.html"){
                    $scope.displayOptions.addingNewTerm = true;
                    focus('suggest'); // switch focus to freebase typeahead
                    return [];
                } else {
                     return [{name:"- term not found -"}];
                }
            } else {
                return response.data.matches;
            }
        });       
    };

    $scope.addToSelectedFromDB = function(){
        contentTerms.selected.push({name:$scope.displayOptions.DBTerm.name,UUID:$scope.displayOptions.DBTerm.UUID});
        $scope.displayOptions.DBTerm = "";
    };

    $scope.openNewTermModal = function (termData) {
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

    $scope.$watch('displayOptions.DBTerm', function(){
        if($scope.displayOptions.DBTerm.length === 0){
            $scope.displayOptions.addingNewTerm = false;
            focus('db');
        }
    });

}).


controller('newTermModalInstanceCtrl' , function ($scope, $modalInstance, data, contentTerms, $http, filterFactory) {

    console.log("data in modal: " + JSON.stringify(data));

    $scope.newTermMeta = {};

    $scope.newTermMeta.type = filterFactory().groups;

    $scope.newTermMeta.name = data.name;
    $scope.newTermMeta.mid = data.mid; 
    $scope.newTermMeta.lang = data.lang;
    console.log("data.lang: " + data.lang);
    
    $scope.$on('$routeChangeStart', function() {
        // TODO: fix error if modal closed properly
        // should be fixed in next angular ui update...
        console.log("closing modal");
        $modalInstance.close();
    });

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

// TODO: auto switch to fb search when no content found in aaddo db
directive('suggest', function() {
    return {
        restrict: 'E',
        template: "<input style='background: url(img/fbIcon.png); background-position: 140px 6px; background-repeat: no-repeat;' ng-model='inputModel' type='text'>",
        replace:true,
        scope:{
            onSelect:'&',
            inputModel:'='
        },
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