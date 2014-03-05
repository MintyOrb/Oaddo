/*global console, angular, setTimeout, alert, window */
'use strict';

var universalLibrary = angular.module('universalLibrary', 
    [
        'ngRoute', 
        'ui.bootstrap',
        'ngSanitize',
        'ngResource',
        'ngCookies',
        'ngAnimate',
        'angularFileUpload',
        'http-auth-interceptor',
        'textAngular',
        'chieffancypants.loadingBar',
        'ngAnimate-animate.css',
        'ngDragDrop',
        'pageslide-directive'
    ]).

config(function($routeProvider, $locationProvider, $httpProvider) {

    //function for checking login status before a route change
    //TODO: consider saving value in a cookie?
    //  this would be easy to fake, but no secure data would be leaked from the server
    var checkLoggedin = function ($q, $timeout, $http, $location, $window, LoginService, $cookieStore) {
        
        console.log("check logged in function here.");

        // Initialize a new promise 
        var deferred = $q.defer();

        console.log("loggedin: ");
        console.log($cookieStore.get('loggedIn'));
        if($cookieStore.get("loggedIn")){
            deferred.resolve();
        } else {
            deferred.reject();
            $window.history.back();
            console.log("before to: " + $location.path());
            LoginService.open();
        }
        return deferred.promise;
    };


    $routeProvider
    .when('/home', { title: "home", templateUrl: 'app/main/tempMain.html'})
    .when('/explore', {title: "explore", templateUrl: 'app/exploreContent/explore.html'})
    .when('/test', {resolve: {loggedin: checkLoggedin}, templateUrl: 'app/main/test.html'})
    .when('/addContent', {title: "new content", resolve: {loggedin: checkLoggedin}, templateUrl: 'app/addingContent/newContent.html'})
    .when('/content/:id', {title: "content", templateUrl: 'app/exploreContent/contentPage.html', controller:'contentPageCtrl'})
    .otherwise({redirectTo: '/home'});
    $locationProvider.html5Mode(true);
}).

run(function ($rootScope, LoginService, $cookieStore, appLanguage) {

    // change site title based on route
    $rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
        if(current.$$route){
            $rootScope.title = current.$$route.title;
        }
    });

    //respond to 401s by opening login modal
    $rootScope.$on('event:auth-loginRequired', function() {
        console.log("auth event fired");
        LoginService.open();
    });

    if($cookieStore.get('loggedIn') !== undefined){
        LoginService.loggedIn = $cookieStore.get('loggedIn');
    }

    //set language for session based on saved value or value from window
    if (appLanguage.get() === undefined){
        var lang = window.navigator.userLanguage || window.navigator.language;
        lang = lang.substr(0,2); // get two letter language code
        console.log("language from window.nav: " + lang);
        appLanguage.set(lang);
    } else {
        appLanguage.set($cookieStore.get('languagePreference'));
    }
    
}).

service('appLanguage', ['$cookieStore',function ($cookieStore) {
    this.set = function(code){
        $cookieStore.put('languagePreference', code);
        this.lang = code;
    };
    this.get = function(){
        return $cookieStore.get('languagePreference');
    };
    this.lang = "";
}]).

controller('appCtrl', ['$scope', 'appLanguage', function ($scope, appLanguage) {
    $scope.displayLanguage = appLanguage;
}]).



//testing
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
        $location.path('/addContent');
    };

    $scope.addTerm = function(){
        console.log("lets add a new term");
        $http.post("/term");
        
    };
    
}).

controller('TabsDemoCtrl', function ($scope) {

    $scope.checked = false;
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
    };
}]);

