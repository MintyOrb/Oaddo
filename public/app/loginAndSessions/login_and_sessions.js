/*global console, angular, setTimeout, alert*/
'use strict';

angular.module('universalLibrary').


controller('LoginModalCtrl', function ($scope, LoginService) {

    console.log("loginModalCtrl here.");
    $scope.Login = LoginService;
    
}).
    
controller('LoginModalInstanceCtrl' , function ($scope, $modalInstance, API, LoginService, authService, $http) {
    console.log("instance ctrl here");
    $scope.form = {};
    $scope.display = {
        validEmail: true,
        validPass: true,
        returningUser: true
    };
    $scope.user = {
        email : "",
        password : "",
        checkPassword: ""
    };

    $scope.checkEmail = function(){
        if($scope.form.loginForm.email.$invalid || $scope.user.email.length === 0){
            $scope.display.validEmail = false;
        } else {
            $scope.display.validEmail = true;
        }
    };
    $scope.checkPass = function() {
        if($scope.user.password !== $scope.user.checkPassword){
            $scope.display.validPass = false;
        } else {
            $scope.display.validPass = true;
        }
    };

    $scope.create = function () {
        if($scope.display.validEmail && $scope.display.validPass){
            $http.post('/user', $scope.user).
            then(function(response){
                console.log(response);
                //if successfull, log user in.
                if(response.data.successfulCreation === true){
                    console.log("successful creation, trying to login: ");
                    $scope.login($scope.user.email, $scope.user.password);
                } else {
                    $scope.message = response.data.message;
                }
                console.log(response);
                
            });
        }
    };

    $scope.login = function (email, password) {
        console.log("email: " +  email);
        console.log("password: " +  password);
        
        if($scope.display.validEmail){
            $http.post("/login", { 'email': email, 'password': password }).
            then(function(response) {
                console.log("were bakc. resonse: ");                
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
        }
    };
    
    $scope.cancel = function () {
        $scope.user = {
            email : "",
            password : "",
            checkPassword: ""
        };
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
                    templateUrl: 'app/loginAndSessions/LoginModal.html',
                    controller: 'LoginModalInstanceCtrl',
                    windowClass: "",
                });
            }
        }
    };
});