/*global console, angular, setTimeout, alert*/
'use strict';

angular.module('adding_content', ['angularFileUpload']).

//   config(function($routeProvider, $locationProvider, $httpProvider) {
//     $routeProvider
//     .when('/content/new', {resolve: {loggedin: checkLoggedin}, templateUrl: 'partials/addingContent/newContent.html'})
//     $locationProvider.html5Mode(true);
// }).

controller('addingContentCtrl', ['$scope', function ($scope) {

    $scope.contentObject = {};
    
}]).

controller("fileUploadCtrl", function ($timeout, $scope, $http, $upload){

    $scope.fileSelected = false;
    $scope.dataUrl = {};

    $scope.alerts = [];
    $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.onFileSelect = function(file) {

        //only allow image files
        if (file[0].type.indexOf('image') === -1) {
            $scope.alerts.push({type: 'danger', msg: "You may only add images files from your local file system at this time."});
        } else {

            if (window.FileReader) {
                var fileReader = new FileReader();
                fileReader.readAsDataURL(file[0]);
                fileReader.onload = function(e) {
                    $timeout(function() {
                        $scope.dataUrl.image = e.target.result;
                    });
                };
            }    

            $scope.fileSelected = true;
            $scope.fileName = file[0].name;

            $upload.upload({
                url: '/newImage',
                file: file[0],
                //best way to get extension?
                data: {name:file[0].name},
                progress: function(evt){
                //TODO show upload progress to user
                    console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
                }
            }).then(function(data, status, headers, config) {
                // return new file server URL from server and update newContent obj
                // file is uploaded successfully
                console.log("it worked: " + data);
            }); 
        }
    };

    $scope.validateURL = function () {
        console.log("validate here");
        // console.log("valid: " + $scope.addContentForm.pasteURL.$valid);

        console.log("URL: " + $scope.contentObject.contentURL);
        if($scope.addContentForm.pasteURL.$valid && $scope.contentObject.contentURL.length > 0){
            //send to server to validation and/or downloading (if necessary)

            $http.post('/validateURL', {'url':$scope.contentObject.contentURL}).
            success(function(){
    
            });
        } else {
            // $scope.alerts.push({type: 'danger', msg: "Not a valid URL"});

        }
    };
}).


service('contentTerms', [function () {
    this.selectedTerms = [];
}]).

controller("termSelectionCtrl", function ($scope, contentTerms, $http) {

    $scope.terms = contentTerms.selectedTerms;

   
    $scope.addToSelected = function(termData){
        //add to array to prevent visual delay
        contentTerms.selectedTerms.push({mid:termData.mid,name:termData.name,langAddedIn:termData.lang});
        //add to database (if not already stored) and return UUID
        $http.post('/term', termData)
        .success(function(returned){
            //add UUID to item in selectedTerms
            for(var index = 0; index < contentTerms.selectedTerms.length; index++){
                if(contentTerms.selectedTerms[index].mid === termData.mid){
                    contentTerms.selectedTerms.UUID = returned.UUID;
                }
            }
            console.log("data: " + JSON.stringify(returned));
        });
        console.log("selectedTerms: " + JSON.stringify(contentTerms.selectedTerms));

    };

    $scope.removeFromSelected = function(id){
        for(var index = 0; index < contentTerms.selectedTerms.length; index++){
            if(contentTerms.selectedTerms[index].mid === id){
                contentTerms.selectedTerms.splice(index,1);
            }
        }
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