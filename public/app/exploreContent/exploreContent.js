/*global console, angular, setTimeout, window, FileReader, $ */
'use strict';

angular.module('universalLibrary').

controller("exploreCtrl", function ($scope, contentTerms, $http, appLanguage) {

	// $scope.findRelatedContent = function(){
	// 	$http.post("/")
	// };

    $scope.contentTerms = contentTerms;
    $scope.DBTerm = "";
    $scope.typeAhead = [];

    $scope.filter = {
        people: true,
        organizations: true,
        physicalObjects: true,
        concepts: true,
        jargon: true,
        disciplines: true,
        activities: true,
        locations: true,
        contentTypes: true,
    };

    //filter popover function
    $scope.setAll = function(value){
        console.log("hi: "+value);
        for (var term in $scope.filter) {
            $scope.filter[term] = value;
        }
    };

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

service('contentTerms', [function () {
    this.selected = [];     // tag content with
    this.discarded = [];    // remove from suggested
    this.related = [];      // return based on search
    this.search = [];       // find terms related to these
}]);