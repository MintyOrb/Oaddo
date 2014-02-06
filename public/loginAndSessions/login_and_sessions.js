/*global console, angular, setTimeout, alert*/
'use strict';

angular.module('loginAndSessions', []).


controller('LoginModalCtrl', function ($scope, LoginService) {

    console.log("loginModalCtrl here.");
    $scope.Login = LoginService;
    
}).
    
controller('LoginModalInstanceCtrl' , function ($scope, $modalInstance, API, LoginService, authService, $http) {
    console.log("instance ctrl here");
    $scope.message = "test";
    $scope.newUser = {};
    
    $scope.create = function () {
        // var user = new API.User();
        // user.data = $scope.newUser;
        // console.log("user: " + user);
        // user.$save();
        $http.post('/user', $scope.newUser);
        $modalInstance.close();
    };

    $scope.login = function (username, password) {
        console.log("username: " +  username);
        var login = new API.Login();
        console.log("password: " +  password);
        login.$save({ 'username': username, 'password': password }, 
            function (data) { // success callback
                console.log("success here");
                console.log(data);
                $modalInstance.close();
                LoginService.modalIsOpen = false;

            // do what you want with values returned from successful request, contained in 'data'
            },
            function (error) {
                console.log("error here");
                console.log(error); // Error details
                $scope.message = error.data.message;
            }
        );
    };
    
    $scope.cancel = function () {
        $scope.newUser = {};
        $scope.username = "";
        $scope.password = "";
        $modalInstance.dismiss('cancel');
        LoginService.modalIsOpen = false;
    };

    //when modal closes make sure to note it in LoginService
    $modalInstance.result.then(function () {
        console.log('Modal success at:' + new Date());
        authService.loginConfirmed();
        console.log('Login Confirmed: ' + new Date());
        LoginService.modalIsOpen = false;
    }, function () {
        console.log('Modal dismissed at: ' + new Date());
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