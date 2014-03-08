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
        // NOTE: dropping term from search into search leads to multiple instances of terms being returned
        // this should be fixed with correct term drop logic (restricting drop zones)
        $http.post('/relatedTerms', { 
            matchAll: $scope.contentTerms.matchAll,
            ignoreTerms: $scope.contentTerms.discarded,
            keyTerms: $scope.contentTerms.selected,
            type: $scope.filter.terms,
            language: appLanguage.lang }).
        success(function(data){
            
            if($scope.contentTerms.related.length > 0){
                var matched = [];
                // for earch term in related go though results get name if also found in results.
                for (var i = 0; i < $scope.contentTerms.related.length; i++) {
                    for (var x = 0; x < data.results.length; x++) {
                        if($scope.contentTerms.related[i].name === data.results[x].name){
                            matched.push(data.results[x].name);
                        }
                    }
                    console.log("related: " + $scope.contentTerms.related[i].name);
                }
                
                if(matched.length > 0){
                    // remove terms from related if not a match
                    var length = $scope.contentTerms.related.length;
                    while (length--){
                        if(matched.indexOf($scope.contentTerms.related[length].name) < 0){
                            $scope.contentTerms.related.splice(length,1);
                        }   
                    }
                } else {
                    $scope.contentTerms.related = [];
                }
                // add results to related if not a match
                for (var ii = 0; ii < data.results.length; ii++) {
                    if( matched.indexOf(data.results[ii].name ) < 0 ){
                        $scope.contentTerms.related.push(data.results[ii]);
                    }
                }
            } else {
                for (var jj = 0; jj < data.results.length; jj++) {
                    $scope.contentTerms.related.push(data.results[jj]);
                }
            }
            
        });
    };

    //typeahead from neo4j
    $scope.findTerm = function()
    {   
        return $http.get('/termTypeAhead', { params: { entered: $scope.displayOptions.DBTerm, language: appLanguage.lang } }).
        then(function(response){
            if(!response.data.results){
                $scope.displayOptions.addingNewTerm = true;
                focus('suggest'); // for switching search source
                return [{name:"- term not found -"}];
            } else {
                return response.data.matches;
            }
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
    this.matchAll = true;   // specifies whether all or any terms must be matched
    this.selected = [];     // tag content with
    this.discarded = [];    // remove from suggested
    this.related = [];      // return based on search
    this.search = [];       // find terms related to these
}]).


factory('filterFactory', [function () {
    
    
    return {
        addGroup: function(group){
            for (var term in this.terms) {
                if(this.terms[term].name === group){
                    this.terms[term].included = true;
                }
            }
        },
        removeGroup: function(group){
            for (var term in this.terms) {
                if(this.terms[term].name === group){
                    this.terms[term].included = false;
                }
            }
        },
        selectGroup : function(group){
            console.log("called: " + group);            
            for (var term in this.terms) {
                if(this.terms[term].name === group){
                    this.terms[term].included = true;
                } else {
                    this.terms[term].included = false;
                }
            }
        },
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
            },
            // events: {
            //     included: false,
            //     name: 'event',
            // }
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