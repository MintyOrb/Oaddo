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
});
