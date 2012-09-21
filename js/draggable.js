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
	var udf		= function (v) { return typeof(v) === "undefined"; };
	
	/* convert value to prc */
	var val2prc = function (x, t) { return (100 * x) / t; };		
	
	/* default options */
	var defaults = {
		usePercentage: true,
		onStart:  $.noop,
		//onMove:   $.noop,
		onChange: $.noop,
		onEnd:    $.noop
	};
	
	/* events & mobile */
	var isMobile = /android|iphone|ipad|mobile/i.test(navigator.userAgent);
	var events = {
		"click"  : isMobile ? "touchstart" : "click",
		"down"   : isMobile ? "touchstart" : "mousedown",
		"move"   : isMobile ? "touchmove"  : "mousemove",
		"up"     : isMobile ? "touchend"   : "mouseup",
		"cancel" : "touchcancel"
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
			lastLeft    = $(element).position().left,
			lastPrc		= val2prc(lastLeft, $(container).width()),
			lastEvent   = null,
			originEvent = null;

			
		//--------------------------------------------------------------------------
		//
		//  Private methods
		//
		//-------------------------------------------------------------------------	
		
		/**
		 * Call function
		 *
		 * @param cb
		 * @param data
		 */
		function call(cb, data) {
			if (vars[cb]) {
				vars[cb](data);
			}
		}
		
		/**
		 * Moveto
		 *
		 * @param val The new left value where to move the object
		 */
		function moveTo(val) {

			if (lastLeft != val) {
				var prc = val2prc(val, $(container).width());
				if (vars.usePercentage) {
					$(element).css('left', prc + "%");
				}
				else {
					$(element).css('left', val + "px");
				}
				call("onChange", {event: lastEvent, left: val, prc: lastPrc});
				
				lastPrc  = prc;
				lastLeft = val;
			}
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
			if (!drag) {
				// console.log("start dragging");
				call("onStart", {event: event, left: lastLeft, prc: lastPrc});
			}
			
			drag = true;			
			if (isMobile) {
				var orig     = event.originalEvent,
					position = $(element).position();
				
				originEvent  = {x: orig.changedTouches[0].pageX - position.left};				
			}
			lastEvent = event;
			return false;
		}
		
		
		/**
		 * Handle mouse up
		 *
		 * @param event
		 */
		function handleMouseUp(event) {
			if (drag) {
				// console.log("stop dragging");
				call("onEnd", {event: lastEvent, left: lastLeft, prc: lastPrc});
			}
			
			drag      = false;
			lastEvent = null;
			originEvent = null;
		}
		
		/**
		 * Handle mouse move
		 *
		 * @param event
		 */
		function handleMouseMove(event) {
			if (isMobile) {
				return handleMouseMoveMobile(event);
			}
			
			if (!drag || !lastEvent) {
				return;
			}
			
			var diff = lastEvent.pageX - event.pageX,
				min  = 0,
				max  = $(container).width(),
				left = $(element).position().left;
				
			left -= diff;
			if (left < min) {
				left = min;
			}
			else if (left > max) {
				left = max;
			}
			
			moveTo(left);
			
			lastEvent = event;
			return false;
		}
		
		/**
		 * Handle mouse move mobile
		 *
		 * @param event
		 */
		function handleMouseMoveMobile(event) {
			if (!drag || !event) {
				return true;
			}
			
			var orig = (event.originalEvent.touches[0] || event.originalEvent.changedTouches[0]), 
				left =  orig.pageX - originEvent.x,
				min  = 0,
				max  = $(container).width();
			
			if (left < min) {
				left = min;
			}
			else if (left > max) {
				left = max;
			}
			
			moveTo(left);
			
			lastEvent = event;			
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