/*global console, angular, setTimeout, window, FileReader, $ */
'use strict';

angular.module('universalLibrary').

controller("termSelectionCtrl", function ($scope, contentTerms, $http, appLanguage, filterFactory, $modal) {

    $scope.contentTerms = contentTerms;
    
    $scope.filter = filterFactory();
    $scope.filter.setAll(true);  // initialize filter values to true (include all types)

    $scope.$watch("filter.groups", function(newValue, oldValue){
        if (newValue !== oldValue) {
            getRelatedTerms();
        }
    }, true); // true as second parameter sets up deep watch

    // fetch terms related when search term array or filter options change
    $scope.$watchCollection("contentTerms.selected", function(){
        getRelatedTerms();
    });

    $scope.openTermModal = function (termData) {
        var modalInstance = $modal.open({
            templateUrl: 'app/shared/termModal.html',
            controller: 'termModalInstanceCtrl',
            windowClass: "",
            resolve: {
                data: function () {
                    return termData;
                }
            }
        });
    };
    var getRelatedTerms = function(){
        // NOTE: dropping term from search into search leads to multiple instances of terms being returned
        // this should be fixed with correct term drop logic (restricting drop zones)
        $http.post('/relatedTerms', { 
            matchAll: $scope.contentTerms.matchAll,
            ignoreTerms: $scope.contentTerms.discarded,
            keyTerms: $scope.contentTerms.selected,
            groups: $scope.filter.groups,
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

    $scope.dropFromHandler = function(index, termArray){  // this method can be replaced by addToFrom()
        termArray.splice(index, 1);
    };

    $scope.recievingHandler = function(data, termArray){  // this method can be replaced by addToFrom()
        termArray.push(data);
    };

    $scope.addToFrom = function(to,from,term,index){
        to.push(term);
        from.splice(index, 1);
    };

}).

controller("termTypeAheadCtrl", function ($scope, focus, $modal, $http, appLanguage, contentTerms) {

    $scope.contentTerms = contentTerms;
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
                if($scope.getCurrentTemplate() === "app/addingContent/newContent.html" || $scope.getCurrentTemplate() === "app/exploreContent/contentPage.html"){
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

    $scope.addToSelectedFromDB = function(selected){
        if($scope.displayOptions.DBTerm.name !== "- term not found -") {
            selected.push({name:$scope.displayOptions.DBTerm.name,UUID:$scope.displayOptions.DBTerm.UUID});
        }
        $scope.displayOptions.DBTerm = "";
    };

    $scope.openNewTermModal = function (termData, selected) {
        console.log("about to open modal: " );
        var modalInstance = $modal.open({
            templateUrl: 'app/addingContent/newTermModal.html',
            controller: 'newTermModalInstanceCtrl',
            windowClass: "",
            resolve: {
                data: function () {
                    return {termData:termData, selected: selected};
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

service('contentTerms', [function () {
    this.emptyAll = function(){
        this.selected = [];  
        this.discarded = []; 
        this.related = [];   
        this.search = [];    
    };
    this.matchAll = true;   // specifies whether all or any terms must be matched
    this.selected = [];     // tag content with
    this.discarded = [];    // remove from suggested
    this.related = [];      // return based on search
    this.search = [];       // find terms related to these
}]).

// TODO: refactory- this seems really messy as a factory
factory('filterFactory', ['$http',function ($http) {
    // non-singlton factory
    return function(){
        var Groups = function(){
            this.addGroup= function(group){
                for (var term in this.groups) {
                    if(this.groups[term].name === group){
                        this.groups[term].included = true;
                    }
                }
            };
            this.removeGroup= function(group){
                for (var term in this.groups) {
                    if(this.groups[term].name === group){
                        this.groups[term].included = false;
                    }
                }
            };
            this.selectGroup = function(group){
                for (var term in this.groups) {
                    if(this.groups[term].name === group){
                        this.groups[term].included = true;
                    } else {
                        this.groups[term].included = false;
                    }
                }
            };
            this.setAll = function(value){
                for (var term in this.groups) {
                    this.groups[term].included = value;
                }
            };

            this.isCollapsed= true;

            this.groups= {
                sciences: {
                    included: false,
                    name: 'science',
                },
                humanities: {
                    included: false,
                    name: 'humanities',
                },
                environment: {
                    included: false,
                    name: 'environment',
                },
                technology: {
                    included: false,
                    name: 'technology',
                },
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

        };
        return new Groups();        
    };
}]).

controller('termModalInstanceCtrl', ['$scope', '$modalInstance', 'data', 'filterFactory', '$http',function ($scope, $modalInstance, data, filterFactory, $http) {
    console.log("in modal: " );
    $scope.term = data;
    $scope.term.groupObj = filterFactory();
    $scope.term.groups = $scope.term.groupObj.groups;
    
    $http.get('/termGroups', {params: {uuid: $scope.term.UUID}})
    .success(function(results){
        for (var ii = 0; ii < results.length; ii++) {
            $scope.term.groupObj.addGroup(results[ii].name);
        }           
    });

    $scope.saveChanges = function(){
        $http.post('/termGroups', {uuid: $scope.term.UUID, groups: $scope.term.groups})
        .then(function(results){
            if(results.data.success){
                for (var ii = 0; ii < results.length; ii++) {
                    $scope.term.groupObj.addGroup(results[ii].name);
                }           
                $modalInstance.close();
            } else {
                // TODO: display error
            }
        });
    };

    $scope.$on('$routeChangeStart', function(event, current, previous) {
        $modalInstance.close("location change");
    });

    $scope.cancel = function(){
        $modalInstance.close("cancel");
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
    },20);
  };
});