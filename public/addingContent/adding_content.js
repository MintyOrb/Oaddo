/*global console, angular, setTimeout, alert*/
'use strict';

angular.module('adding_content', ['angularFileUpload']).

//   config(function($routeProvider, $locationProvider, $httpProvider) {
//     $routeProvider
//     .when('/content/new', {resolve: {loggedin: checkLoggedin}, templateUrl: 'partials/addingContent/newContent.html'})
//     $locationProvider.html5Mode(true);
// }).

controller("fileUploadCtrl", function ($scope, $upload){

    $scope.onFileSelect = function($files) {
      //$files: an array of files selected, each file has name, size, and type.
      for (var i = 0; i < $files.length; i++) {
        var file = $files[i];
        $scope.upload = $upload.upload({
          url: 'server/upload/url', //upload.php script, node.js route, or servlet url
          // method: POST or PUT,
          // headers: {'headerKey': 'headerValue'},
          // withCredential: true,
          data: {myObj: $scope.myModelObj},
          file: file,
          // file: $files, //upload multiple files, this feature only works in HTML5 FromData browsers
          /* set file formData name for 'Content-Desposition' header. Default: 'file' */
          //fileFormDataName: myFile, //OR for HTML5 multiple upload only a list: ['name1', 'name2', ...]
          /* customize how data is added to formData. See #40#issuecomment-28612000 for example */
          //formDataAppender: function(formData, key, val){} 
        }).progress(function(evt) {
          console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
        }).success(function(data, status, headers, config) {
          // file is uploaded successfully
          console.log(data);
        });
        //.error(...)
        //.then(success, error, progress); 
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