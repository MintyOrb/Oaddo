/*global console, angular, setTimeout, window, FileReader, $ */
'use strict';

angular.module('adding_content', ['angularFileUpload']).

controller('addingContentCtrl', ['$scope', function ($scope) {

    $scope.contentObject = {};

    $scope.submitNewContent = function(){
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
            }).then(function(data, status, headers, config) {
                $scope.contentObject.savedAs = data.savedAs;
                $scope.contentObject.fileSystemID = data.id;
                $scope.contentObject.displayType = data.displayType;
                console.log("it worked: " + data);
            }); 
        }
    };

    $scope.onURLChange = function () {
        
        $scope.displaySettings.uploadNonImage = false; //hide error message if inputting a URL

        if($scope.addContentForm.pasteURL.$valid && $scope.contentObject.webURL.length > 0){

            $scope.displaySettings.optionSelected = true;  //display cancel button
            $scope.displaySettings.disableFileSelection = true;

            $http.post('/validateURL', {url: $scope.contentObject.webURL, language: appLanguage.lang}).
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
        $scope.contentObject.displayType = "";
        $scope.contentObject.webURL = "";
    };
}).

















service('contentTerms', [function () {
    this.selected = [];     // tag content with
    this.discarded = [];    // remove from suggested
    this.related = [];      // return based on search
    this.search = [];       // find terms related to these
}]).
  

controller('NewTermModalInstanceCtrl' , function ($scope, $modalInstance) {

    $scope.ok = function () {
        $modalInstance.close();
    };
       
    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}).



controller("termSelectionCtrl", function ($scope, contentTerms, $http, appLanguage, $modal) {
   
    $scope.selected = contentTerms.selected;
    $scope.DBTerm = "";
    $scope.typeAhead = [];

    //typeahead from neo4j
    $scope.findTerm = function()
    {   
        $http.get('/termQuery', { params: { entered: $scope.DBTerm, language: appLanguage.lang } }).
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

   
    $scope.addToSelectedFromFB = function(termData){
        //add to array to prevent visual delay
        contentTerms.selected.push({mid: termData.mid,name: termData.name,langAddedIn: termData.lang});
        //add to database (if not already stored) and return UUID
        $http.post('/term', termData)
        .success(function(returned){
            //add UUID to item in selected
            for(var index = 0; index < contentTerms.selected.length; index++){
                if(contentTerms.selected[index].mid === termData.mid){
                    contentTerms.selected.UUID = returned.UUID;
                }
            }
            console.log("data: " + JSON.stringify(returned));
        });
        console.log("selected: " + JSON.stringify(contentTerms.selected));

    };

    $scope.removeFromSelected = function(id){
        for(var index = 0; index < contentTerms.selected.length; index++){
            if(contentTerms.selected[index].mid === id){
                contentTerms.selected.splice(index,1);
            }
        }
    };

    $scope.openNewTermModal = function () {
        var modalInstance = $modal.open({
          templateUrl: 'partials/addingContent/newTermModal.html',
          controller: 'NewTermModalInstanceCtrl',
          windowClass: "",
        });
    };

}).

directive('suggest', function() {
    return {
        restrict: 'E',
        template: "<input type='text'>",
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