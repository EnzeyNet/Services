(function (angular) {
    "use strict";

	var module = angular.module('net.enzey.services.directives', []);

	module.directive('nzTranscludedInclude', function() {
		return {
			restrict: "A",
			transclude: true,
			templateUrl: function(element, attrs) {
				return attrs[this.name];
			},
		}
	});

	module.directive('nzSquelchEvent', function($parse) {
		return {
			compile: function ($element, $attrs) {
				var directiveName = this.name;
				var events = $attrs[directiveName];
				events = events.split(',');
				events = events.map(function(eventType) {return eventType.trim()});

				var squelchCondition = $attrs['squelchCondition'];

				return function(scope, element, attrs) {
					var squelchEvent = true;
					if (angular.isDefined(squelchCondition)) {
						squelchEvent = $parse(squelchCondition)(scope);
					}
					if (squelchEvent) {
						events.forEach(function(eventType) {
							element.bind(eventType, function(event) {
								event.stopPropagation();
							});
						});
					}
				};
			}
		};
	});

})(angular);