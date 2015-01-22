(function (angular) {
    "use strict";

	var module = angular.module('net.enzey.services.dom', []);

	module.service('nzDomHelper', ['$window', '$document', '$timeout', function ($window, $document, $timeout) {

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

	}]);

})(angular);
//End of file
(function (angular) {
    "use strict";

	var module = angular.module('net.enzey.services.events', []);

	module.service('nzEventHelper', ['$window', '$document', '$timeout', function ($window, $document, $timeout) {

		var eventMatchers = {
			'HTMLEvents': {
				isEvent: function(eventName) {
					return /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/.test(eventName);
				},
				fireEvent: function(element, eventName, options) {
					var oEvent = null;
					if ($document[0].createEvent) {
						oEvent = document.createEvent('HTMLEvents');
						oEvent.initEvent(eventName, options.bubbles, options.cancelable);
						element.dispatchEvent(oEvent);
					} else {
						options.clientX = options.pointerX;
						options.clientY = options.pointerY;
						var evt = $document[0].createEventObject();
						oEvent = extend(evt, options);
						element.fireEvent('on' + eventName, oEvent);
					}
				}
			},
			'MouseEvents': {
				isEvent: function(eventName) {
					return /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/.test(eventName);
				},
				fireEvent: function(element, eventName, options) {
					var oEvent = null;
					if ($document[0].createEvent) {
						oEvent = document.createEvent('MouseEvents');
						oEvent.initMouseEvent(eventName, options.bubbles, options.cancelable, $document[0].defaultView,
						options.button, options.pointerX, options.pointerY, options.pointerX, options.pointerY,
						options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.button, options.element);
						element.dispatchEvent(oEvent);
					} else {
						options.clientX = options.pointerX;
						options.clientY = options.pointerY;
						var evt = $document[0].createEventObject();
						oEvent = extend(evt, options);
						element.fireEvent('on' + eventName, oEvent);
					}
				}
			}
		};
		var defaultOptions = {
			pointerX: 0,
			pointerY: 0,
			button: 0,
			ctrlKey: false,
			altKey: false,
			shiftKey: false,
			metaKey: false,
			bubbles: true,
			cancelable: true
		};

		this.emulateEvent = function simulate(element, eventName) {
			var options = arguments[2] ? arguments[2] : angular.copy(defaultOptions);
			options.element = options.element ? options.element : element
			var fireEventFn = null;

			for (var name in eventMatchers) {
				if (eventMatchers[name].isEvent(eventName)) {
					fireEventFn = eventMatchers[name].fireEvent;
					break;
				}
			}

			if (!fireEventFn) {
				throw new SyntaxError('Only HTMLEvents and MouseEvents interfaces are supported');
			}

			fireEventFn(element, eventName, options);
		};

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

		this.registerMouseDragHandler = function(mdElem, startMoveFunction, moveFunction, endMoveFunction, delay) {
			mdElem.on('mousedown', function(mouseDownEvent) {
				mouseDownEvent.preventDefault();
				startMoveFunction(mouseDownEvent);

				var originalMouseX = mouseDownEvent.pageX;
				var originalMouseY = mouseDownEvent.pageY;

				var updateFnId;
				var moveAction = function(mouseMoveEvent) {
					$timeout.cancel(updateFnId);
					var xDelta = mouseMoveEvent.pageX - originalMouseX;
					var yDelta = mouseMoveEvent.pageY - originalMouseY;
					updateFnId = $timeout(function() {
						moveFunction(xDelta, yDelta, mouseDownEvent, mouseMoveEvent);
					}, delay >= 0 ? delay : 5, false);
				};
				$document.on('mousemove', moveAction);

				var mouseUpAction = function(mouseUpEvent) {
					$document.off('mousemove', moveAction);
					$timeout.cancel(updateFnId);
					$document.off('mouseup', mouseUpAction);
					endMoveFunction(mouseUpEvent);
				};
				$document.on('mouseup', mouseUpAction);
			});
		};

		var currentDrag = {};
		this.registerDragHandler = function(draggableElem, dragType, dragStartAction, dragEndAction) {
			draggableElem.setAttribute('draggable', true);

			draggableElem.addEventListener('dragstart', function(event) {
				event.dataTransfer.setData("text/html", draggableElem.outerHTML);
				event.dataTransfer.setData("text/plain", draggableElem.outerText);
				event.dataTransfer.setData("application/octet-stream", draggableElem.outerText);
				currentDrag.element = draggableElem;
				currentDrag.type = dragType;

				if (typeof dragStartAction === 'function') {dragStartAction(event);}
			});
			draggableElem.addEventListener('dragend', function(event) {
				currentDrag = {};
				if (typeof dragEndAction === 'function') {dragEndAction(event);}
			});
		};

		this.registerDropHandler = function(droppableElem, dragType, dragEnterAction, dragOverAction, dragLeaveAction, dropAction) {
			droppableElem.addEventListener("dragenter", function(event) {
				if (currentDrag.element === droppableElem || currentDrag.type !== dragType) {return;}

				if (typeof dragEnterAction === 'function') {dragEnterAction(event);}
			});
			droppableElem.addEventListener("dragover", function(event) {
				if (currentDrag.element === droppableElem || currentDrag.type !== dragType) {return;}
				event.preventDefault();

				if (typeof dragOverAction === 'function') {dragOverAction(event);}
			});
			droppableElem.addEventListener("dragleave", function(event) {
				if (currentDrag.element === droppableElem || currentDrag.type !== dragType) {return;}

				if (typeof dragLeaveAction === 'function') {dragLeaveAction(event);}
			});
			droppableElem.addEventListener('drop', function(event) {
				event.preventDefault();

				if (typeof dropAction === 'function') {dropAction(currentDrag.element, droppableElem, event);}
			});
		};

	}]);

	module.directive('nzFakeDocClick', ['$document', '$timeout', 'nzEventHelper', function($document, $timeout, nzEventHelper) {
		return {
			link: function(scope, $element, $attrs) {
				$element.on('click', function(event) {
					$timeout(function() {
						nzEventHelper.emulateEvent($document[0].body, 'click', event);
					}, 0, false);
				});
			},
		}
	}]);

})(angular);
//End of file
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

	module.directive('nzSquelchEvent', ['$parse', function($parse) {
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
	}]);

})(angular);
//End of file
(function (angular) {
    "use strict";

	var module = angular.module('net.enzey.services', [
		'net.enzey.services.directives',
		'net.enzey.services.dom',
		'net.enzey.services.events',
		'net.enzey.services.styles',
	]);

})(angular);
//End of file
(function (angular) {
    "use strict";

	var module = angular.module('net.enzey.services.styles', []);

	module.service('nzStyleHelper', ['$window', '$document', '$timeout', function ($window, $document, $timeout) {

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

	}]);

})(angular);