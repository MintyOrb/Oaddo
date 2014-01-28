/*global console, angular */
'use strict';

var universalLibrary = angular.module('universalLibrary', 
    [
        'ngRoute', 
        'ui.bootstrap',
        'ngSanitize',
        'ngResource',
        'adding_content',
        'http-auth-interceptor',
        'language_universality',
        'textAngular'
    ]).
    config(function($routeProvider, $locationProvider, $httpProvider) {

    //do this in cookies instead?
    var checkLoggedin = function ($q, $timeout, $http, $location, $window, LoginService) {
        
        console.log("check logged in function here.");

        // Initialize a new promise 
        var deferred = $q.defer();
    
        // Make an AJAX call to check if the user is logged in
        $http.get('/loggedin').success(function(response){
            // Authenticated
            if (response.message === true){
                console.log("user is logged in...");
                deferred.resolve();
            // Not Authenticated
            } else {
                console.log('user needs to login...');
                $window.history.back();
                console.log("location: " + $location.path());
                deferred.reject();

                LoginService.open();
    
            }
        });

        return deferred.promise;
    };

    $routeProvider
    .when('/home', {templateUrl: 'partials/main/tempMain.html', controller: 'tempMainCtrl'})
    .when('/test', {resolve: {loggedin: checkLoggedin}, templateUrl: 'partials/main/test.html'})
    .when('/content/new', {resolve: {loggedin: checkLoggedin}, templateUrl: 'partials/addingContent/newContent.html'})
    .otherwise({redirectTo: '/home'});
    $locationProvider.html5Mode(true);
}).

run(function ($rootScope, LoginService) {

     $rootScope.$on('event:auth-loginRequired', function() {
            console.log("auth event fired");
            LoginService.open();
        });
    
}).

controller('LoginModalCtrl', function ($scope, LoginService) {

    console.log("loginModalCtrl here.");
    $scope.Login = LoginService;
    
}).
    
controller('LoginModalInstanceCtrl' , function ($scope, $modalInstance, API, LoginService, authService) {
    console.log("instance ctrl here");
    $scope.message = "test";
    $scope.newUser = {};
    
    $scope.create = function () {
        var user = new API.User();
        user.data = $scope.newUser;
        console.log(user);
        user.$save();
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
        //$modalInstance.close();

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
        LoginService.modalIsOpen = false;
    });


}).

controller('buttonCtrl', function($scope, API, $location, $http) {
    
    $scope.logout = function (){
        var logout = new API.Logout();
        logout.$save(function(data){
            console.log(data);
        });
    };
    $scope.loggedin = function(){
        var loggedin = new API.LoggedIn();
        loggedin.$get(function(response){
            console.log(response);
        });
    };

    $scope.test = function(){
        var test = new API.test();
        test.$get(function(response){
            console.log(response);
        });
    };

    $scope.navigateToAddContent = function(){
        console.log("lets add new content");
        $location.path('/content/new');
    };

    $scope.addTerm = function(){
        console.log("lets add a new term");
        $http.post("/term");
        
    };
    
}).

factory('API', ['$resource', function ($resource) {
    return {
        User: $resource('/user/:id', {id: '@id'} ),
        Login: $resource('/login'),
        Logout: $resource('/logout'),
        LoggedIn: $resource('/loggedin'),
        test: $resource('/test')
        // Group:  $resource('/groups/:id', {id: '@id'})
    };
}]).

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
}).

controller('tempMainCtrl', function ($scope) {
        $scope.hello = "Hi! controller here";
}).

    controller('TabsDemoCtrl', function ($scope) {

      $scope.tabs = [
      { title:"Dynamic Title 1", content:"Dynamic content 1" },
      { title:"Dynamic Title 2", content:"Dynamic content 2", disabled: true }
    ];
  
    $scope.alertMe = function() {
      setTimeout(function() {
        alert("You've selected the alert tab!");
      });
    };
  
    $scope.navType = 'pills';
});

