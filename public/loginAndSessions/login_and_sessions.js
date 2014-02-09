/*global console, angular, setTimeout, alert*/
'use strict';

angular.module('loginAndSessions', []).


controller('LoginModalCtrl', function ($scope, LoginService) {

    console.log("loginModalCtrl here.");
    $scope.Login = LoginService;
    
}).
    
controller('LoginModalInstanceCtrl' , function ($scope, $modalInstance, API, LoginService, authService, $http) {
    console.log("instance ctrl here");
    
    $scope.message = "";
    $scope.newUser = {};
    
    $scope.create = function () {
        $http.post('/user', $scope.newUser).
        then(function(response){
            console.log(response);
            //if successfull, log user in.
            if(response.data.successfulCreation === true){
                $scope.login($scope.newUser.name, $scope.newUser.password);
            } else {
                $scope.message = response.data.message;
            }
            console.log(response);
            
        });
    };

    $scope.login = function (username, password) {
        console.log("username: " +  username);
        console.log("password: " +  password);
        $http.post("/login", { 'username': username, 'password': password }).

        then(function(response) {
            console.log(response.data.loginSuccessful);
            if(response.data.loginSuccessful === true){
                console.log("success here");
                LoginService.modalIsOpen = false;
                authService.loginConfirmed();
                $modalInstance.close();
            } else {
                $scope.message = response.data.message;
            }
            console.log(response);
            
        });
    };
    
    $scope.cancel = function () {
        $scope.newUser = {};
        $scope.username = "";
        $scope.password = "";
        authService.loginCancelled();
        $modalInstance.dismiss('cancel');
        LoginService.modalIsOpen = false;
    };

    //when modal closes make sure to note it in LoginService
    $modalInstance.result.then(function () {
        console.log('Modal success at:' + new Date());
        authService.loginConfirmed();
        console.log('Login Confirmed: ' + new Date());
        LoginService.modalIsOpen = false;
    }, function (reason) {
        console.log('Modal dismissed at: ' + new Date());
        console.log('Reason Closed: ' + reason);
        authService.loginCancelled();
        LoginService.modalIsOpen = false;
    });

}).

factory('LoginService', function ($modal) {
    
    return {

        modalIsOpen: false,

        open: function () {
            console.log(this.modalIsOpen);
            if(!this.modalIsOpen){

                this.modalIsOpen = true;

                var modalInstance = $modal.open({
                    templateUrl: 'partials/loginAndSessions/LoginModal.html',
                    controller: 'LoginModalInstanceCtrl',
                    windowClass: "",
                });
            }
        }
    };
});