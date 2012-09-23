/*jshint indent:4, laxbreak:true, smarttabs:true */
/**
 * Draggable
 *
 *	
 *	
 * Written by
 * Cristobal Dabed (cristobal@dabed.org)
 *
 * Licensed under the MIT (MIT-LICENSE.txt).
 *
 * @author Cristobal Dabed
 * @version 0.1 ($Id$)
 * 
 **/
 // TODO: Test in IE8+
 // TODO: Test in Mobile devices
 // TODO: Add support for vertical scrolling
 // TODO: Add support for both x,y 
 // TODO: Add support for diagonal scrolling
(function ($) {
	
	//--------------------------------------------------------------------------
	//
	//  Helper methods & Variables
	//
	//-------------------------------------------------------------------------	
	
	/* check if variable is undefined */
	var udf		 = function (v) { return typeof(v) === "undefined"; };
	
	/* convert value to prc */
	var val2prc = function (x, t) { return (100 * x) / t; };		
	
	/* default options */
	var defaults = {
		adjustOffset:  true, /* adjust in respect to the start dragging point */
		usePercentage: true, /* wether to use percentage or pixels, default % */
		updatePos:     true,
		
		
		onStart:  $.noop,
		onChange: $.noop,
		onEnd:    $.noop
	};
	
	/* events & mobile */
	var isMobile = /android|iphone|ipad|mobile/i.test(navigator.userAgent);
	var events   = {
		"click"  : isMobile ? "touchstart" : "click",
		"down"   : isMobile ? "touchstart" : "mousedown",
		"move"   : isMobile ? "touchmove"  : "mousemove",
		"up"     : isMobile ? "touchend"   : "mouseup",
		"cancel" : "touchcancel"
	};
	var triggers = {
		"change": "onChange",
		"start": "onStart",
		"end": "onEnd"
	};

	
	//--------------------------------------------------------------------------
	//
	//  Draggable Class
	//
	//-------------------------------------------------------------------------	
	function Draggable(element, container, options) {
		
		var vars = jQuery.extend({}, defaults, options);
		
		var meta        = {},
			drag        = false,
			dragOrigin  = {
				x: 0,
				y: 0
			},
			pos = {
				x: 0,
				y: 0,
				prcX: 0,
				prxY: 0
			},
			touchOrigin = {
				x: 0,
				y: 0
			},
			lastEvent   = null;
		
		var minX = 0,
			maxX = 0,
			minY = 0,
			maxY = 0,
			offsetX = 0,
			offsetY = 0;

			
		//--------------------------------------------------------------------------
		//
		//  Private methods
		//
		//-------------------------------------------------------------------------	
		
		/**
		 * Trigger
		 *
		 * @param eventType
		 */
		function trigger(eventType) {
			var cb = triggers[eventType];
			if (vars[cb]) {
				var data = {
					event: event,
					pos:   $.extend({}, pos)
				};
				vars[cb](data);
			}
		}
		
		/**
		 * Moveto
		 *
		 * @param val The new left value where to move the object
		 */
		function moveTo(x, y) {
			if (pos.x != x) {
				var prcX = val2prc(x, $(container).width()),
					prcY = 0;
				if (vars.usePercentage) {
					$(element).css('left', prcX + "%");
				}
				else {
					$(element).css('left', x + "px");
				}
				
				pos.y    = y;
				pos.x    = x;
				pos.prcX = prcX;
				pos.prcY = prcY;
				trigger("change");
				
				return true;
			}
			
			return false;
		}

			
		//--------------------------------------------------------------------------
		//
		//  Events
		//
		//-------------------------------------------------------------------------	
		
		/**
		 * Handle mouse down
		 *
		 * @param event
		 */
		function handleMouseDown(event) {
			if (drag) {
				return;
			}
			
			var x = 0, 
				y = 0, 
				offset   = $(element).offset(),
				position = $(element).position();
			
			x = event.offsetX;
			if (udf(offset.x)) {
				x = event.clientX - offset.left;
			}
			
			y = event.offsetY;
			if (udf(y)) {
				y = event.clientY - offset.top;
			}
			
			if (isMobile) {
				var orig = event.originalEvent.changedTouches[0];
				
				touchOrigin.x = orig.pageX - position.left;
				touchOrigin.y = orig.pageY - position.top;
			}
			
			dragOrigin.x = x;
			dragOrigin.y = y;
			
			pos.x     = position.left;
			pos.y     = position.top;
			pos.prcX  = val2prc(pos.x, $(container).width());
			pos.prcY  = val2prc(pos.y, $(container).height());
			
			maxX = $(container).width();
			maxY = $(container).height();
			
			offsetX = vars.adjustOffset ? dragOrigin.x : 0;
			offsetY = vars.adjustOffset ? dragOrigin.y : 0;
			
			lastEvent = event;
			trigger("start");
			drag      = true;
			return false;
		}
		
		
		/**
		 * Handle mouse up
		 *
		 * @param event
		 */
		function handleMouseUp(event) {
			if (drag) {
				trigger("end");
			}
			
			drag        = false;
			lastEvent   = null;
		}
		
		/**
		 * Handle mouse move
		 *
		 * @param event
		 */
		function handleMouseMove(event) {
			if (!drag || !lastEvent || !event) {
				return true;
			}
			
			var x    = 0,
				y    = 0;
			
			if (isMobile) {
				var orig = (event.originalEvent.touches[0] || event.originalEvent.changedTouches[0]);
				x = orig.pageX - (touchOrigin.x + offsetX);
				// y = orig.pageY - (touchOrigin.y + offsetY);
			}
			else {
				var offset = $(container).offset();
				x = event.clientX - (offset.left + offsetX);
				// y = event.clientY - (offset.top  + offsetY);
				
				//var dx = lastEvent.pageX - event.pageX,
				//    dy = lastEvent.pageY - event.pageY;
				//    x -= dx,
				//    y -= dy;
			}

			
			if (x < minX) {
				x = minX;
			}
			else if (x > maxX) {
				x = maxX;
			}
			
			// 
			// if (y < minY) {
			//  y = minY;
			// }
			// else if (y > maxY) {
			//  y = maxY;
			// }
			
			lastEvent = event;
			if (moveTo(x, y)) {
				maxX = $(container).width();
				maxY = $(container).height();
			}
			
			return false;
		}
		
		//--------------------------------------------------------------------------
		//
		//  Public API
		//
		//-------------------------------------------------------------------------	
		return {
			
			/**
			 * Enabled
			 *
			 * @param value get/set value
			 */
			enabled: function (value) {
				if (udf(value)) {
					return meta.enabled;
				}
				
				if (value && !meta.enabled) {
					$(element).on(events.down, handleMouseDown);
					$(element).on(events.up, handleMouseUp);
					$(element).on(events.move, handleMouseMove);
					$(element).on(events.cancel, handleMouseUp);
					
					$(document).on(events.up, handleMouseUp);
				    $(document).on(events.move, handleMouseMove);
				}
				else {
					$(element).off(events.down, handleMouseDown);
					$(element).off(events.up, handleMouseUp);
					$(element).off(events.move, handleMouseMove);
					$(element).off(events.cancel, handleMouseCancel);
					
					$(document).off(events.up, handleMouseUp);
				    $(document).off(events.move, handleMouseMove);
				}
				meta.enabled = value;
			},
			
			/**
			 * Wether we are currently dragging
			 */
			dragging: function () { return drag; },
			
			/**
			 * Destroy and cleanup
			 */
			destroy: function () {
				this.enabled(false);
				
				meta        = null;
				lastEvent   = null;
				originEvent = null;
			}
		};
	}
	
	// Defaults
	Draggable.defaults = defaults;
	
	// Link to window
	window.Draggable   = Draggable;
})(jQuery); 