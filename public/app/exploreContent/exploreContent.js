/*global console, angular, setTimeout, window, FileReader, $ */
'use strict';

angular.module('universalLibrary').

controller("exploreCtrl", function ($scope, contentTerms, viewContent, $location, $http, appLanguage, filterFactory) {
	
	// NOTE: this controller contains largly identical functionality to the termSelection controller
		// consider refactoring to be more DRY
	$scope.contentTerms = contentTerms;
    $scope.DBTerm = "";
    $scope.typeAhead = [];
    $scope.returnedContent = [];
    
    $scope.filter = filterFactory;
    $scope.filter.setAll(true);  // initialize filter values to true (include all types)
    console.log("filter.isCollapsed: " + $scope.filter.isCollapsed);

    $scope.getRelatedContent = function(){
		$http.post('/explore', { 
            includedTerms: $scope.contentTerms.selected,
            excludedTerms: $scope.contentTerms.discarded, 
            language: appLanguage.lang }).
        success(function(data){
            console.log("data: " + JSON.stringify(data));
            $scope.returnedContent = data;            
        });
	};

	$scope.getRelatedTerms = function(){
        // clear current related
        // TODO: only remove terms that are not again returned? (prevent term from vanishing only to re-appear)
        $scope.contentTerms.related = [];

        $http.post('/relatedTerms', { 
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


    // NOTE: is there a better solution to getting terms on filter change?
    //  maybe keep an array of all the values and watch that instead?
    $scope.$watch("filter", function(newValue, oldValue){
		if (newValue !== oldValue) {
			console.log("triggered filter: ");
			$scope.getRelatedTerms();
		}
    }, true); // true as second parameter sets up deep watch

    // fetch related terms and content when search term array or filter options change
    $scope.$watchCollection("contentTerms.selected", function(newValue, oldValue){
		$scope.getRelatedTerms();
		$scope.getRelatedContent();
		console.log("selected triggered: " );
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

    $scope.navigateToContentPage = function(content){
        viewContent.selected = content;
        console.log("viewContent.selected: ");
        console.log(content);
        $location.url('content/' + content.UUID);
    };
}).






service('viewContent', [function () {
    this.selected = {};
}]).












controller('contentPageCtrl', ['$scope', "viewContent", function ($scope, viewContent) {
	
    $scope.content = viewContent.selected;
    console.log("scope.content: " );
    console.log($scope.content.savedAs );
	
}]).


directive('zui', [function () {
    console.log("in directive: " );
	return {
		restrict: 'E',
		scope: { url: "@"},
        // NOTE: changed overlay style of .zui div to visible and added 'left':'0', 'right':'0' to viewport div in prototype in zui53.js
        // TODO: find better solution for centering displayed content - this method allows the user to zoom on the magin 'wings' used for initial centering
		template: '<div id="zui" style="z-index:-1;" ><div id="viewport" ><img src="{{imageURL}}" style="display:block; margin-left: auto; margin-right: auto; max-height: 400px;"></div></div>',
		link: function (scope, element, attrs) {
			console.log("url: " );
            console.log(scope.url);
            scope.imageURL = scope.url;

			var zui = new ZUI53.Viewport( document.getElementById('zui') );
            zui.addSurface( new ZUI53.Surfaces.CSS( document.getElementById('viewport') ) );
            
            var pan_tool = new ZUI53.Tools.Pan(zui);
            zui.toolset.add( pan_tool );
            pan_tool.attach();
		}
	};
}]);

