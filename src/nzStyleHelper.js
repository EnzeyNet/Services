(function (angular) {
    "use strict";

	var module = angular.module('net.enzey.services.styles', []);

	module.service('nzStyleHelper', function ($window, $document, $timeout) {

		var getJsStyleName = function(styleName) {
			var firstCharacterRegex = new RegExp('^.');
			styleName = styleName.split('-');
			for (var i = 1; i < styleName.length; i++) {
				styleName[i] = styleName[i].replace(firstCharacterRegex, styleName[i][0].toUpperCase());
			}
			return styleName.join('');
		};

		this.copyComputedStyles = function(toElement, fromElement) {
			var comStyle = $window.getComputedStyle(fromElement);
			for (var i = 0; i < comStyle.length; i++) {
				var styleName = getJsStyleName(comStyle[i]);
				toElement.style[ styleName ] = comStyle[ styleName ];
			}

			return toElement;
		}

	});

})(angular);