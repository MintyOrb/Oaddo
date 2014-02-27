/*global console, angular, setTimeout, alert*/
'use strict';

angular.module('universalLibrary').


controller('LoginModalCtrl', function ($scope, modalService) {
    console.log("loginModalCtrl here.");
    $scope.Login = modalService;
}).
    
controller('LoginModalInstanceCtrl' , function ($scope, API, modalService, authService, $http) {
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
        
        if($scope.display.validEmail){
            $http.post("/login", { 'username': email, 'password': password }).
            then(function(response) {
                if(response.data.loginSuccessful === true){
                    console.log("success here");
                    authService.loginConfirmed();
                    modalService.close();
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
        modalService.close();
        
    };

    //when modal closes make sure to note it in modalService
    modalService.modalInstance.result.then(function () {
        console.log('Modal success at:' + new Date());
        authService.loginConfirmed();
        console.log('Login Confirmed: ' + new Date());
        modalService.modalIsOpen = false;
    }, function (reason) {
        console.log('Modal dismissed at: ' + new Date());
        console.log('Reason Closed: ' + reason);
        authService.loginCancelled();
        modalService.modalIsOpen = false;
    });

});

