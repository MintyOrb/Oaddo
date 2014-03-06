/*global console, angular, setTimeout, window, FileReader, $ */
'use strict';

angular.module('universalLibrary').

controller("termSelectionCtrl", function ($scope, focus, contentTerms, $http, appLanguage, $modal, filterFactory) {

    $scope.contentTerms = contentTerms;
    
    $scope.filter = filterFactory;
    $scope.filter.setAll(true);  // initialize filter values to true (include all types)

    $scope.displayOptions = {
        DBTerm : "",
        addingNewTerm : false // display freebase input or dbinput depending
    };

    $scope.$watch("filter.terms", function(newValue, oldValue){
        if (newValue !== oldValue) {
            getRelatedTerms();
        }
    }, true); // true as second parameter sets up deep watch

    // fetch terms related when search term array or filter options change
    $scope.$watchCollection("contentTerms.selected", function(){
        getRelatedTerms();
    });

    var getRelatedTerms = function(){
        // clear current related
        // TODO: only remove terms that are not again returned? (prevent term from vanishing only to re-appear)
        $scope.contentTerms.related = [];
        // NOTE: dropping term from search into search leads to multiple instances of terms being returned
        // this should be fixed with correct term drop logic (restricting drop zones)
        $http.post('/relatedTerms', { 
            keyTerms: $scope.contentTerms.selected,
            type: $scope.filter.terms,
            language: appLanguage.lang }).
        success(function(data){
            for (var i = 0; i < data.results.length; i++) {
                $scope.contentTerms.related.push(data.results[i]);
            }
        });
    };

    //typeahead from neo4j
    $scope.findTerm = function()
    {   

        console.log("search: ");
        console.log($scope.displayOptions.DBTerm);
        return $http.get('/termTypeAhead', { params: { entered: $scope.displayOptions.DBTerm, language: appLanguage.lang } }).
        then(function(response){
            if(!response.data.results){
                $scope.displayOptions.addingNewTerm = true;
                focus('suggest');
            }
            return response.data.matches;
        });       
    };

    $scope.addToSelectedFromDB = function(){
        contentTerms.selected.push({name:$scope.displayOptions.DBTerm.name,UUID:$scope.displayOptions.DBTerm.UUID});
        $scope.displayOptions.DBTerm = "";
    };

    $scope.dropFromHandler = function(index, termArray){
        termArray.splice(index, 1);
    };

    $scope.recievingHandler = function(data, termArray){
        termArray.push(data);
    };

}).

service('contentTerms', [function () {
    this.selected = [];     // tag content with
    this.discarded = [];    // remove from suggested
    this.related = [];      // return based on search
    this.search = [];       // find terms related to these
}]).


factory('filterFactory', [function () {
    
    
    return {

        setAll : function(value){
            for (var term in this.terms) {
                this.terms[term].included = value;
            }
        },

        isCollapsed: true,

        terms: {
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
        }
        
    };
}]).


directive('focusOn', function() {
   return function(scope, elem, attr) {
      scope.$on('focusOn', function(e, name) {
        if(name === attr.focusOn) {
          elem[0].focus();
        }
      });
   };
}).

factory('focus', function ($rootScope, $timeout) {
  return function(name) {
    $timeout(function (){
      $rootScope.$broadcast('focusOn', name);
    },10);
  };
});