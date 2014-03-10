/*global console, angular, setTimeout, window, FileReader, $ */
'use strict';

angular.module('universalLibrary').

controller("exploreCtrl", function ($scope, $http, appLanguage, contentTerms) {

    $scope.contentTerms = contentTerms;
    $scope.returnedContent = [];

    $scope.$watchCollection("contentTerms.selected", function(){
        getRelatedContent();
    });

    $scope.$on("$routeChangeStart", contentTerms.emptyAll());

    var getRelatedContent = function(){
        $http.post('/explore', { 
            includedTerms: $scope.contentTerms.selected,
            excludedTerms: $scope.contentTerms.discarded, 
            language: appLanguage.lang }).
        success(function(data){
            $scope.returnedContent = data; 
        });
    };
}).


service('viewContent', [function () {
    this.selected = {};
}]).


controller('contentPageCtrl', ['$sce', '$http','$routeParams', '$scope', "viewContent", "appLanguage", function ($sce, $http, $routeParams, $scope, viewContent, appLanguage) {
	
    $scope.panelVisible = true;
    $scope.panelHalfScreen = true;

    // TODO: handle error - if content with UUID not found, display error
    $http.get('/content', {params: {uuid: $routeParams.id, language: appLanguage.get()}})
    .success(function(data){
        viewContent.selected = data[0];  
        $scope.content = viewContent.selected;
        $scope.content.embedSrc = $sce.trustAsResourceUrl($scope.content.embedSrc);
        $scope.content.webURL = $sce.trustAsResourceUrl($scope.content.webURL);

    });

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
            // TODO: find alternative to doc.getbyID for zui initilization
			var zui = new ZUI53.Viewport( document.getElementById('zui') );
            zui.addSurface( new ZUI53.Surfaces.CSS( document.getElementById('viewport') ) );
            
            var pan_tool = new ZUI53.Tools.Pan(zui);
            zui.toolset.add( pan_tool );
            pan_tool.attach();
		}
	};
}]);

