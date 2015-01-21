(function (angular) {
    "use strict";

	var module = angular.module('net.enzey.services.dom', []);

	module.service('nzDomHelper', function ($window, $document, $timeout) {

		this.isElementFullyInViewport = function(elem) {
			var boundingBox = elem.getBoundingClientRect();

			var viewportHeight = ($window.innerHeight || $document[0].documentElement.clientHeight);
			var viewportWidth =  ($window.innerWidth || $document[0].documentElement.clientWidth);

			// Has Negative Position
			if (0 > boundingBox.bottom) {return false;}
			if (0 > boundingBox.right)  {return false;}

			// Is out of viewport
			if (viewportHeight < boundingBox.bottom) {return false;}
			if (viewportWidth  < boundingBox.right)  {return false;}

			return true;
		};

		this.isElementAboveViewport = function(elem) {
			return elem.getBoundingClientRect().top < 0;
		};

		this.isElementBelowViewport = function(elem) {
			var viewportHeight = ($window.innerHeight || $document[0].documentElement.clientHeight);
			return elem.getBoundingClientRect().bottom > viewportHeight;
		};

	});

})(angular);