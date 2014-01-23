'use strict';

angular.module('language_universality', []).

	controller('tempCtrl', function ($scope) {

		var supportedLanguages = [
			'en'
		];

		var lang = window.navigator.userLanguage || window.navigator.language;
		if (lang) {
		    if (lang.length > 2) {
		        // Convert e.g. 'en-GB' to 'en'. We do not support
		        // resources for specific cultures at the moment.
		        lang = lang.substring(0, 2);
		    }
		    
		    // If language not supported, use english
		    if (supportedLanguages.indexOf(lang) === -1) {
		    	lang = 'en';
		    }
		}
		else {
		    lang = 'en';
		}
	});