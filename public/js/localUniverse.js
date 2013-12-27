'use strict';

localUniverse = angular.module('localUniverse', ['ngRoute', 'localUniverse.controllers']).
  config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    $routeProvider.when('/home', {templateUrl: 'partials/tempMain.html', controller: 'tempMainCtrl'})
    .when('/test', {templateUrl: 'partials/test.html'})
    .otherwise({redirectTo: '/home'});
    $locationProvider.html5Mode(true);
  }]);


