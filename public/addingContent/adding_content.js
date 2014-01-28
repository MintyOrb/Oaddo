/*global console, angular, setTimeout, alert*/
'use strict';

angular.module('adding_content', []).

//   config(function($routeProvider, $locationProvider, $httpProvider) {
//     $routeProvider
//     .when('/content/new', {resolve: {loggedin: checkLoggedin}, templateUrl: 'partials/addingContent/newContent.html'})
//     $locationProvider.html5Mode(true);
// }).

	
  controller('NewTermModalCtrl', function ($scope, $modal) {

    $scope.open = function () {

      var modalInstance = $modal.open({
        templateUrl: 'partials/addingContent/newTermModal.html',
        controller: 'NewTermModalInstanceCtrl',
        windowClass: "",
      });
    };
	}).
	
  controller('NewTermModalInstanceCtrl' , function ($scope, $modalInstance) {

      $scope.newTerm = {
        termName: "",
        termDef: "",
        person: false,
        place: false,
        group: false,
        idea: false,
        descriptor: false,
        object: false,
        jargon: false,
        study: false,
        language: "en"
      };

      $scope.ok = function () {
        $modalInstance.close();
      };
		
      $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
      };
}).

  controller('DropdownCtrl', ['$scope', function ($scope) {
     $scope.items = [
    "The first choice!",
    "And another choice for you.",
    "but wait! A third!"
  ];
}]).
  controller('TabsDemoCtrl', ['$scope', function ($scope) {
    
 
  $scope.tabs = [
    { title:"Dynamic Title 1", content:"Dynamic content 1" },
    { title:"Dynamic Title 2", content:"Dynamic content 2", disabled: true }
  ];

  $scope.alertMe = function() {
    setTimeout(function() {
      alert("You've selected the alert tab!");
    });
  };

  $scope.navType = 'tabs';

}]).

directive('suggest', function($http) {
    //TODO search language reflect users preferred language
    //TODO attribute for languge

    return {
        restrict: 'E',
        template: "<input type='text'>",
        replace:true,
        link: function(scope, element, attrs) {
          var language = 'en';
          $(element).suggest({
            "key": "AIzaSyCrHUlKm60rk271WLK58cZJxEnzqNwVCw4",
            "lang": language
          })
          .bind("fb-select", function(e, data) { 
            console.log(data);
            $http.post("/term",data);
          });
  
        }
    };
});