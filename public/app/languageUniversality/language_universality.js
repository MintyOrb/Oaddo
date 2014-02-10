/*globals window, angular, console*/
'use strict';

angular.module('language_universality', []);

// run(function ($cookieStore, appLanguage) {

// 	var langFromCookie = $cookieStore.get('languagePreference');

// 	if (langFromCookie === undefined){
// 		var lang = window.navigator.userLanguage || window.navigator.language;
// 		$cookieStore.put('languagePreference',lang);
// 		console.log("language from window.nav: " + lang);
// 		appLanguage.lang = lang;
// 		//shorten to two letter code?
// 	} else {
// 		//set lang pref based on previously stored cookie
// 		appLanguage.lang = langFromCookie;
// 	}
// }).

// service('appLanguage', [function () {
// 	this.lang = "";
// }]);