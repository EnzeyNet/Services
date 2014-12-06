(function (angular) {
    "use strict";

	var module = angular.module('net.enzey.services', []);

	module.service('nzService', function ($document, $timeout) {
		// position flyout

		var getChildElems = function(elem) {
			var childElems = [];
			elem = angular.element(elem);
			var children = elem.children();
			for (var i=0; i < children.length; i++) {
				getChildElems(children[i]).forEach(function(childElem) {
					childElems.push(childElem);
				});
			}
			childElems.push(elem[0]);

			return childElems;
		};

		this.registerClickAwayAction = function(clickAwayAction) {
			var wrappedClickAwayAction = null;
			var parentElems = [];
			for (var i = 1; i < arguments.length; i++) {
				parentElems.push(arguments[i]);
			}
			wrappedClickAwayAction  = function(event) {
				var allElements = [];
				parentElems.forEach(function(parentElem) {
					getChildElems(parentElem).forEach(function (elem) {
						allElements.push(elem);
					});
				});
				if (allElements.indexOf(event.target) === -1) {
					$document.off('click', wrappedClickAwayAction);
					clickAwayAction(event);
				}
			};
			$timeout(function() {
				$document.on('click', wrappedClickAwayAction);
			});
		};

	});

	module.directive('nzIncludeTransclude', function() {
		return {
			restrict: "A",
			transclude: true,
			templateUrl: function(element, attrs) {
				return attrs[this.name];
			},
		}
	});

})(angular);