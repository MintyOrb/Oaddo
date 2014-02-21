/*global console, angular, setTimeout, window, FileReader, $ */
'use strict';

angular.module('universalLibrary').

service('contentTerms', [function () {
    this.selected = [];     // tag content with
    this.discarded = [];    // remove from suggested
    this.related = [];      // return based on search
    this.search = [];       // find terms related to these
}]).

factory('filterFactory', [function () {
    
    
    return {

        setAll : function(value){
            for (var term in this) {
                this[term].included = value;
            }
        },

        isCollapsed: false,

        people: {
            included: false,
            name: 'person',
        },
        organizations: {
            included: false,
            name: 'organization',
        },
        physicalObjects: {
            included: false,
            name: 'physical object',
        },
        concepts: {
            included: false,
            name: 'concept',
        },
        jargon: {
            included: false,
            name: 'jargon',
        },
        disciplines: {
            included: false,
            name: 'discipline',
        },
        activities: {
            included: false,
            name: 'activity',
        },
        locations: {
            included: false,
            name: 'location',
        },
        contentTypes: {
            included: false,
            name: 'content type',
        }
        
    };
}]);