'use strict';

var localUniverse = angular.module('localUniverse', 
    [
        'ngRoute', 
        'ui.bootstrap',
        'ngSanitize',
        'localUniverse.controllers',
        'adding_content',
        'language_universality'
    ]).
    config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    $routeProvider
    .when('/home', {templateUrl: 'partials/tempMain.html', controller: 'tempMainCtrl'})
    .when('/test', {templateUrl: 'partials/test.html'})
    .otherwise({redirectTo: '/home'});
    $locationProvider.html5Mode(true);
}]);


