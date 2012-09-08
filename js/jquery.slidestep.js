/**
 * jquery.slidestep - Slidestep ui control in jQuery
 * 
 * Written by
 * Cristobal Dabed (cristobal@dabed.org)
 *
 * Licensed under the MIT (MIT-LICENSE.txt).
 *
 * @author Cristobal Dabed
 * @version 0.1
 * 
 * Dependencies
 * 
 * 
 **/
// TODO: CSS3 Animations
;(function ($) {
	
	//--------------------------------------------------------------------------
	//
	//  Helper Lamnda Functions
	//
	//-------------------------------------------------------------------------
	var prc = function(x, t){ return (x * 100) / t; };
	var val = function(x, p){ return (p * x) / 100; };
	var udf = function(v) { return typeof(v) == "undefined"; };
	
	//--------------------------------------------------------------------------
	//
	//  Slidestep 
	//
	//-------------------------------------------------------------------------
	
	// Slidestep: Object instance
	Slidestep = function (el, options) {
		var slidestep = $(el), 
			handle    = null,
			rail	  = null,
			vars	  = null;
			
			var descriptors = {
				easing: 'string',
				adjustOffset: 'boolean',
				slideOnClick: 'boolean'
			};
			
			var meta  = {
				data: {},
				get: function(key) {
					return meta.data.hasOwnProperty(key) ? meta.data[key] : null;
				},
				set: function(key, value) {
					meta.data[key] = value;
				}
			};
			
			var offsets = {};
			

		// slidestep DOM reference for use outside of the plugin
		$.data(el, "slidestep", slidestep);
		
		function init() {
			var html;
			
			vars = $.extend({}, Slidestep.defaults, options);
			
			html = vars.rail.template.replace("{{className}}", vars.rail.className);
			$(el).append(html)
				 .addClass('slidestep');
			
			rail = $(el).find('.' + vars.rail.className);
			
			html = vars.handle.template.replace("{{className}}", vars.handle.className);
			$(rail).append(html);
			
			handle = $(el).find('.' + vars.handle.className);

			$(handle).css('left', vars.min + "%")
 					 .attr('unselectable', 'on');
			
			if (vars.adjustOffset) {
				slidestep.set("adjustOffset", true);
			}
			
			if (vars.slideOnClick) {
				slidestep.set("slideOnClick", true);
			}
		};
		
		
		//--------------------------------------------------------------------------
		//
		//  Private Functions
		//
		//-------------------------------------------------------------------------
		
		/**
		 * Set var
		 *
		 * @param key 	 The key to set to the vars 
		 * @param value  The value for the option
		 */
		function setVar (key, value) {
			if (!vars.hasOwnProperty(key) || !(key in descriptors)) {
				return;
			}

			switch(descriptors[key]) {
				case 'boolean': {
					vars[key] = value ? true : false;
					break;
				}
			}			
			return;
		};
		
		/**
		 * Get var
		 *
		 * @param key 	The option parameter value we want to retrieve
		 */
		function getVar (key) {
			if (key == "options") {
				return $.extend({}, vars); // get shallow copy of all options
			}
			
			if (!vars.hasOwnProperty(key)) {
				return null;
			}
			
			var value = vars[key];
			if (typeof(value) == 'object') {
				value = $.extend({}, value); // return shallow copy if object
			}
			
			return value;
		};
		
		/**
		 * Map offset
		 *
		 * @param x
		 */
		function mapOffset (x) {
			/*if (x in offsets) {
				return offsets[x];
			}*/
			
			
			var min	  = vars.min,
				max   = vars.max,
				i 	  = 0,
				l	  = $(el).width(),
				value = prc(x, l);
			
			// snap to step (normalize value)
			value = parseInt(Math.round(value), 10);
				
			if (value < min) {
				value = min;
			}
			else if (value > max){
				value = max;
			}

			
			
			offsets[x] = value;
			return offsets[x];
		};
		
		/**
		 * Slide to
		 *
		 * @param value
		 */
		function slideTo (value) {
			$(handle).animate({
				left: value + "%"
			});
		};
		
		//--------------------------------------------------------------------------
		//
		//  Events
		//
		//-------------------------------------------------------------------------
		
		/**
		 * Handle slide on click
		 *
		 * @param event
		 */
		function handleSlideOnClick (event) {
			if (event.target == handle) {
				return;
			}
			
			slideTo(
				mapOffset(event.offsetX)
			);
		};
		
		
		//--------------------------------------------------------------------------
		//
		//  Public Functions
		//
		//-------------------------------------------------------------------------
		
		/**
		 * Set
		 *
		 * @param option The option value to set
		 * @param value	 The value for the option
		 */
		slidestep.set = function (option, value) {
			if ((option in slidestep) && typeof(slidestep[option] == "function")) {
				slidestep[option](value);
			}
			else if ((option == "options") && value && (typeof(value) == 'object')){
				for (option in value) {
					slidestep.set(option, value[option]);
				}
			}
		};
		
		/**
		 * Get
		 *
		 * @param option The option value to get
		 */
		slidestep.get = function (option) { return getVar(option); };
		
		/**
		 * Adjust offset
		 *
		 * @param value  Boolean value to wether adjust offset or not
		 */
		slidestep.adjustOffset = function (value) {
			if (udf(value)) {
				return slidestep.get("slideOnClick");
			}
			
			var key = 'adjustOffset'; 
			setVar(key, value);
			meta.set(key, value);
			
			var offset = value ? $(handle).width() : 0;
			$(rail).css('right', offset + 'px');
		};
		
		/**
		 * Slide on click
		 *
		 * @param value  Boolean value to wether enable slideOnClick or not
		 */
		slidestep.slideOnClick = function (value) {
			if (udf(value)) {
				return slidestep.get("slideOnClick");
			}
			var key = 'slideOnClick'; 
			setVar(key, value);
			
			if (value && !meta.get(key)) {
				$(el).on('click', handleSlideOnClick);
			}
			else if (meta.get('slideOnClick')) {
				$(el).off('click', handleSlideOnClick);
			}
			
			meta.set(key, false);
			return;
		};
		
		// Slidestep: Initialize
		init();
	};
	
	// Slidestep: Default Settings
	Slidestep.defaults = {
		min: 0,
		max: 100,
		step: 1,
		easing:  "swing",
		adjustOffset: true,
		slideOnClick: false,
		onSlide:  jQuery.noop,
		onStart:  jQuery.noop,
		onChange: jQuery.noop,
		rail: {
			className: 'rail',
			template: '<div class="{{className}}"></div>'
		},
		handle: {
			className: 'handle',
			template: '<a class="{{className}}" href="#"></a>'
		}			
	};

	$.fn.slidestep = function(options) {
		return this.each(function () {
			if (!$(this).data('slidestep')) {
				new Slidestep(this, options);
			}
			else {
				$(this).data('slidestep').set.apply(option, Array.prototype.slice.call( arguments, 1));
			}
		});
	};
})(jQuery); 