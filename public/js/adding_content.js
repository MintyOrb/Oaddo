'use strict';

angular.module('adding_content', []).
	
  controller('NewTermModalCtrl', function ($scope, $modal) {

  	$scope.open = function () {

   		var modalInstance = $modal.open({
   			templateUrl: 'partials/newTermModal.html',
   			controller: 'NewTermModalInstanceCtrl',
   			windowClass: "",
   		});
    }
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
      }

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

 }])