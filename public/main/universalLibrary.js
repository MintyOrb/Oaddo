/*global console, angular, setTimeout, alert */
'use strict';

var universalLibrary = angular.module('universalLibrary', 
    [
        'ngRoute', 
        'ui.bootstrap',
        'ngSanitize',
        'ngResource',
        'adding_content',
        'loginAndSessions',
        'language_universality',
        'http-auth-interceptor',
        'textAngular'
    ]).
    config(function($routeProvider, $locationProvider, $httpProvider) {

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
}]);

