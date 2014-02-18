/*global console, angular, setTimeout, window, FileReader, $ */
'use strict';

angular.module('universalLibrary').

controller("exploreCtrl", function ($scope, contentTerms, $http, appLanguage, filterFactory) {
	
	// NOTE: this controller contains largly identical functionality to the termSelection controller
		// consider refactoring to be more DRY
	$scope.contentTerms = contentTerms;
    $scope.DBTerm = "";
    $scope.typeAhead = [];
    
    $scope.filter = filterFactory;
    $scope.filter.setAll(true);  // initialize filter values to true (include all types)

	var getRelatedTerms = function(){
        // clear current related
        // TODO: only remove terms that are not again returned? (prevent term from vanishing only to re-appear)
        $scope.contentTerms.related = [];

        $http.post('/relatedTerms', { 
            discardedTerms: $scope.contentTerms.discarded, 
            keyTerms: $scope.contentTerms.selected,
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
    $scope.$watchCollection("contentTerms.selected", function(){
        getRelatedTerms();
        console.log("triggered selected: " );
    });

    // NOTE: is there a better solution to getting terms on filter change?
    //  maybe keep an array of all the values and watch that instead?
    $scope.$watchCollection("[filter.people.included,filter.organizations.included,filter.physicalObjects.included,filter.concepts.included,filter.jargon.included,filter.disciplines.included,filter.activities.included,filter.locations.included,filter.contentTypes.included,filter.people.included]", function(){
        console.log("triggered filter: ");
        getRelatedTerms();
    });

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

    $scope.findRelatedContent = function(){
		$http.post('/explore', { 
            // selectedTerms: $scope.contentTerms.selected,
            // discardedTerms: $scope.contentTerms.discarded, 
            // keyTerms: $scope.contentTerms.search,
            // type: $scope.filter,
            language: appLanguage.lang }).
        success(function(data){
            console.log("data: " + JSON.stringify(data));
            
        });
	};
});