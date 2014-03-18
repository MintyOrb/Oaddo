/*global console, angular, setTimeout, window, FileReader, $ */
'use strict';

angular.module('universalLibrary').

controller("exploreCtrl", function ($scope, $http, appLanguage, contentTerms) {

    $scope.contentTerms = contentTerms;
    $scope.returnedContent = [];

    $scope.$watchCollection("contentTerms.selected", function(){
        getRelatedContent();
    });

    var getRelatedContent = function(){
        $http.post('/explore', { 
            includedTerms: $scope.contentTerms.selected,
            excludedTerms: $scope.contentTerms.discarded, 
            language: appLanguage.lang }).
        success(function(data){
            $scope.returnedContent = data; 
        });
    };
}).


service('viewContent', [function () {
    this.selected = {};
}]).


controller('contentPageCtrl', ['$sce', '$http','$routeParams', '$scope', "viewContent", "appLanguage", '$window', 'filterFactory',function ($sce, $http, $routeParams, $scope, viewContent, appLanguage, $window, filterFactory) {

// TODO: refactor. A lot of this code is the same as in the termSelectionCtrl (in shared)

    $scope.panel = {
        visible : false,
        size : '50%',
        section : 'about',
        editTerms : false
    };

    $scope.content = {
        changesNotMade: true, // disable/enable save changes
        editTerms : false,
        UUID : $routeParams.id,
        originalTerms: [],
        terms: [],
        relatedTerms: [],
        relatedContent:[]
    };

    // console.log($window.outerWidth); use for changeing css for mobile

    // needed for term suggestions when editing content terms
    // $scope.filter = filterFactory();
    // $scope.filter.setAll(true);  // initialize filter values to true (include all types)

    // $scope.$watch("filter.groups", function(newValue, oldValue){
    //     if (newValue !== oldValue && $scope.content.editTerms) {
    //         $scope.getPossibleTerms();
    //     }
    // }, true); // true as second parameter sets up deep watch

    // $scope.$watchCollection('content.terms', function(){
    //     if($scope.content.editTerms){
    //         $scope.getPossibleTerms();
    //     }
    // });

    // TODO: handle error - if content with UUID not found, display error
    $http.get('/content', {params: {uuid: $scope.content.UUID, language: appLanguage.get()}})
    .success(function(data){
        viewContent.selected = data[0];  
        $scope.content.display = viewContent.selected;
        $scope.content.display.embedSrc = $sce.trustAsResourceUrl($scope.content.display.embedSrc);
        $scope.content.display.webURL = $sce.trustAsResourceUrl($scope.content.display.webURL);

    });

    $scope.getContentTerms = function(){
        if($scope.content.terms.length === 0){
            $http.get('/contentTerms', {params: {uuid: $scope.content.UUID, language: appLanguage.get()}})
            .success(function(returned){
                for (var ii = 0; ii < returned.length; ii++) {
                    $scope.content.terms.push(returned[ii]);
                    $scope.content.originalTerms.push(returned[ii]);
                }
            });
        }
    };

    $scope.remove = function (index){
        $scope.content.changesNotMade = false;
        $scope.content.terms.splice(index,1);
    };

    $scope.cancelEdit = function(){
        $scope.content.changesNotMade = true;
        $scope.panel.editTerms = false;
        $scope.content.terms=[];
        for (var ii = 0; ii < $scope.content.originalTerms.length; ii++) {
            $scope.content.terms.push($scope.content.originalTerms[ii]);
        }
    };

    $scope.saveNewTerms = function(){
        $http.put('/contentTerms',{newTerms:$scope.content.terms, contentID:$scope.content.UUID})
        .success(function(){
            console.log("back: " );
        });
    };

    // $scope.getPossibleTerms = function(){
    //     $http.post('/relatedTerms', 
    //         {
    //             matchAll: false, 
    //             uuid: $scope.content.UUID, 
    //             language: appLanguage.get(),
    //             keyTerms: $scope.content.terms,
    //             groups: $scope.filter.groups
    //         })
    //     .success(function(data){
    //         $scope.content.relatedTerms = data.results;
    //     });
    // };
    // $scope.getRelatedContent = function(){
    //     $http.post('/explore', { 
    //         includedTerms: $scope.contentTerms.selected,
    //         excludedTerms: $scope.contentTerms.discarded, 
    //         language: appLanguage.lang }).
    //     success(function(data){
    //         $scope.returnedContent = data; 
    //     });
    // };



}]).






directive('zui', [function () {
	return {
		restrict: 'E',
		scope: { url: "@"},
        // NOTE: changed overlay style of .zui div to visible and added 'left':'0', 'right':'0' to viewport div in prototype in zui53.js
        // TODO: find better solution for centering displayed content - this method allows the user to zoom on the magin 'wings' used for centering
		template: '<div id="zui" style="z-index:-1;" ><div id="viewport" ><img src="{{imageURL}}" style="display:block; margin-left: auto; margin-right: auto; max-height: 400px;"></div></div>',
		link: function (scope, element, attrs) {
            scope.imageURL = scope.url;
			var zui = new ZUI53.Viewport( document.getElementById('zui') );
            zui.addSurface( new ZUI53.Surfaces.CSS( document.getElementById('viewport') ) );
            
            var pan_tool = new ZUI53.Tools.Pan(zui);
            zui.toolset.add( pan_tool );
            pan_tool.attach();
		}
	};
}]).



// TODO: trim unneeded functionality
directive('pageslide', [
     function (){
        var defaults = {};
        /* Return directive definition object */

        return {
            restrict: "EA",
            replace: false,
            transclude: false,
            scope: true,
            link: function ($scope, el, attrs) {
                /* Inspect */
                //console.log($scope);
                //console.log(el);
                //console.log(attrs);
                
                /* parameters */
                var param = {};
                param.side = attrs.pageslide || 'right';
                param.speed = attrs.psSpeed || '0.5';
                param.size = attrs.size || '300px';

                /* DOM manipulation */
                var content = (attrs.href) ? document.getElementById(attrs.href.substr(1)) : document.getElementById(attrs.psTarget.substr(1));
                var slider = document.createElement('div');
                slider.id = "ng-pageslide";

                /* Style setup */
                slider.style.transitionDuration = param.speed + 's';
                slider.style.webkitTransitionDuration = param.speed + 's';
                slider.style.zIndex = 499;
                slider.style.position = 'fixed';
                slider.style.width = 0;
                slider.style.height = 0;
                slider.style.transitionProperty = 'width, height';
                
                switch (param.side){
                            case 'right':
                                slider.style.height = attrs.customHeight || '100%'; 
                                slider.style.top = attrs.customTop ||  '0px';
                                slider.style.bottom = attrs.customBottom ||  '0px';
                                slider.style.right = attrs.customRight ||  '0px';
                                break;
                            case 'left':
                                slider.style.height = attrs.customHeight || '100%';   
                                slider.style.top = attrs.customTop || '0px';
                                slider.style.bottom = attrs.customBottom || '0px';
                                slider.style.left = attrs.customLeft || '0px';
                                break;
                            case 'top':
                                slider.style.width = attrs.customWidth || '100%';   
                                slider.style.left = attrs.customLeft || '0px';
                                slider.style.top = attrs.customTop || '0px';
                                slider.style.right = attrs.customright || '0px';
                                break;
                            case 'bottom':
                                slider.style.width = attrs.customWidth || '100%'; 
                                slider.style.bottom = attrs.customBottom || '0px';
                                slider.style.left = attrs.customLeft || '0px';
                                slider.style.right = attrs.customRight || '0px';
                                break;
                        }


                /* Append */
                document.body.appendChild(slider);
                slider.appendChild(content);

                /* Closed */
                function psClose(slider,param){
                    if (slider.style.width !== 0 && slider.style.width !== 0){
                        content.style.display = 'none';
                        switch (param.side){
                            case 'right':
                                slider.style.width = '0px'; 
                                break;
                            case 'left':
                                slider.style.width = '0px';
                                break;
                            case 'top':
                                slider.style.height = '0px'; 
                                break;
                            case 'bottom':
                                slider.style.height = '0px'; 
                                break;
                        }
                    }
                }

                /* Open */
                function psOpen(slider,param){
                    if (slider.style.width !== 0 && slider.style.width !== 0){
                        switch (param.side){
                            case 'right':
                                slider.style.width = param.size; 
                                break;
                            case 'left':
                                slider.style.width = param.size; 
                                break;
                            case 'top':
                                slider.style.height = param.size; 
                                break;
                            case 'bottom':
                                slider.style.height = param.size; 
                                break;
                        }
                        setTimeout(function(){
                            content.style.display = 'block';
                        },(param.speed * 1000));

                    }
                }
                
                /*
                 * Watchers
                 * */

                $scope.$watch(attrs.psOpen, function (value){
                    if (!!value) {
                        // Open
                        psOpen(slider,param);
                    } else {
                        // Close
                        psClose(slider,param);
                    }
                });

                $scope.$on("$locationChangeStart", function(){
                    if(attrs.autoClose){
                        slider.remove();
                        psClose(slider, param);
                    }
                });


                /*
                * Events
                * */
                var close_handler = (attrs.href) ? document.getElementById(attrs.href.substr(1) + '-close') : null;
                if (el[0].addEventListener) {
                    el[0].addEventListener('click',function(e){
                        e.preventDefault();
                        psOpen(slider,param);                    
                    });

                    if (close_handler){
                        close_handler.addEventListener('click', function(e){
                            e.preventDefault();
                            psClose(slider,param);
                        });
                    }
                } else {
                    // IE8 Fallback code
                    el[0].attachEvent('onclick',function(e){
                        e.returnValue = false;
                        psOpen(slider,param);                    
                    });

                    if (close_handler){
                        close_handler.attachEvent('onclick', function(e){
                            e.returnValue = false;
                            psClose(slider,param);
                        });
                    }

                }
            }
        };

     }]);


