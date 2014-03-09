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
    var checkLoggedin = function ($q, $http, $location, $window, LoginService, $cookieStore) {
        
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
    .when('/home', { title: "home", templateUrl: 'app/main/home.html'})
    .when('/explore', {title: "explore", templateUrl: 'app/exploreContent/explore.html'})
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

controller('appCtrl', ['$scope', 'appLanguage', 'LoginService', '$modal',function ($scope, appLanguage, LoginService,$modal) {

    $scope.displayLanguage = appLanguage;
    $scope.Login = LoginService;

    $scope.openTermModal = function (termData) {
        var modalInstance = $modal.open({
            templateUrl: 'app/shared/termModal.html',
            controller: 'termModalInstanceCtrl',
            windowClass: "",
            resolve: {
                data: function () {
                    return termData;
                }
            }
        });
    };

}]).

controller('termModalInstanceCtrl', ['$scope', '$modalInstance', 'data',function ($scope, $modalInstance, data) {
    $scope.term = data;

    $scope.$on('$routeChangeStart', function(event, current, previous) {
        console.log("closing modal");
        $modalInstance.close("cancelled");
    });

    $scope.cancel = function(){
        $modalInstance.close("location change");
    };
}]);

