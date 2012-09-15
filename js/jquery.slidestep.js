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
// TODO: Add support for overriding the animate options
// TODO: Add animate otions on magnetize when large distances otherwise snap only.
// TODO: CSS3 Animations for click when supported
;(function ($) {
	//--------------------------------------------------------------------------
	//
	//  Helper Lambda Functions
	//
	//-------------------------------------------------------------------------
	var udf  = function(v) { return typeof(v) == "undefined"; };
	
	/* check if console is present */
	var ciw = ("console" in window);
	
	//--------------------------------------------------------------------------
	//
	//  Math extensions
	//
	//-------------------------------------------------------------------------
	var MathExt = {};
	
	/**
 	 * Value to percentage
	 *
	 * @param x The value to get percentage for
	 * @param t The total value equivalent to 100%
	 */
	MathExt.val2prc = function(x, t) {
		return (100 * x) / t;
	};
	
	/**
	 * Percentage to value
	 *
	 * @param p The percentage
	 * @param t The total value equivalent to 100%
	 */
	MathExt.prc2val = function(p, t) {
		return (p * t) / 100;
	};
	
	
	//--------------------------------------------------------------------------
	//
	//  Slidestep 
	//
	//-------------------------------------------------------------------------
	// Slidestep: Object instance
	function Slidestep (el, options) {
		var slidestep = $(el), 
			handle    = null,
			rail	  = null,
			vars	  = null,
			oitems	  = null;
			
			var meta      = {};
			
			var set       = new Set();
			var draggable = null;
			var ciw       = ("console" in window);
			 
		// slidestep DOM reference for use outside of the plugin
		$.data(el, "slidestep", slidestep);
		
		function init() {
			vars = $.extend({}, Slidestep.defaults, options);
			$(el).addClass('slidestep')
				 .append(Slidestep.template);

			rail   = $(el).find('.rail').get(0);
			handle = $(el).find('.rail .handle').get(0);
			
			$(handle).attr('unselectable', 'on');
			
			draggable = new Draggable(handle, rail, {
				onEnd: handleDraggableEnd
			});
			
			$.each(["adjustOffset", "items", "grid", "log", "draggable", "slideOnClick"], function(i, key) {
				if (vars.hasOwnProperty(key)) {
					slidestep.set(key, vars[key]);
				}
			});
			
			stepToVal(vars.value);
		};
		
		/**
		 * Log
		 */
		function log() {
			if (vars.log && ciw) {
				try { console.log.apply(console, arguments); }
				catch (error) { /* fail silently console.log not supported */ }	
			}
		}
		
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
		 * Set var
		 *
		 * @param value
		 */
		function setVar (key, value) { vars[key] = value; };
		
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
			if (typeof(value) == 'object' && (typeof(value.concat) != "function")) {
				value = $.extend({}, value); // return shallow copy if object (not array)
			}
			
			return value;
		};
		
		//--------------------------------------------------------------------------
		//
		//  Step/Slide Functions
		//
		//-------------------------------------------------------------------------
		
		function moveTo(prc, val, animate) {
			log("moveTo", prc, val, animate);
			if (animate) {
				$(handle).animate({
					left: prc + "%"
				});
			}
			else {
				$(handle).css('left', prc + "%");
			}
			
			setVar("prc", prc);
			setVar("value", val);
			call("onChange", {val: val, prc: prc});
		};
		
		/**
		 * Move to prc
		 *
		 * @param prc
		 * @param animate
		 */
		function moveToPrc (prc, animate) {
			log("moveToPrc", prc);
			var val = set.findVal(prc); 	// 1. Find the equivalent val
			prc	= set.findPrcByVal(val);	// 2. Snap prc by val
			moveTo(prc, val, animate);		// 3. Move to
		};
		
		/**
		 * Move to val
		 *
		 * @param val
		 * @param animate
		 */
		function moveToVal (val, animate) {
			log("moveToVal", val);
			var prc = set.findPrc(val); 	 // 1. Find the equivalent prc
			val     = set.findValByPrc(prc); // 2. Snap value by prc
			moveTo(prc, val, animate);		 // 3. Move to
		};
			
		/**
		 * Step to
		 *
		 * @param value Percentage from 0..100
		 */
		function stepTo (prc, val) {
			moveTo(prc, val, false)
		};
		
		/**
		 * Step to prc
		 *
		 * @param prc
		 */
		function stepToPrc (prc) {
			moveToPrc(prc, false);
		};
		
		/**
		 * Step to val
		 *
		 * @param val
		 */
		function stepToVal (val) {
			moveToVal(val, false);
		};
	
		/**
		 * Slide to
		 *
		 * @param value Percentage from 0..100
		 */
		function slideTo (prc, val) {
			moveTo(prc, val);
		};
		
		/**
		 * Slide to prc
		 *
		 * @param prc
		 */
		function slideToPrc (prc) {
			moveToPrc(prc, true)
		};
		
		/**
		 * Slide to val
		 *
		 * @param val
		 */
		function slideToVal (val) {
			moveToVal(val, true)
		};
		
		/**
	 	 * Key val
		 *
		 * @param key
		 * @param value
		 * @param refresh
		 */
		function keyVal(key, value, refresh) {
			if (udf(value)) {
				return slidestep.get(key);
			}
			setVar(key, value);
			
			if (udf(refresh)) {
				refresh = true;
			}
			
			if (refresh) {
				slidestep.setItems(oitems);
				if (slidestep.grid()) {
					slidestep.grid(true);
				}
			}
			
			
			return;
		}
		
		
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
			if ((event.target == handle) || !event) {
				return;
			}
			
			var x = event.offsetX;
			if (udf(x)) {
				x = event.clientX - $(el).offset().left;
			}
			
			var prc = MathExt.val2prc(x, $(el).width());
			
			call("onSlide", {prc: prc, val: getVar("val")});
			slideToPrc(prc);
		};
		
		/**
		 * Handle draggable end
		 *
		 * @param event
		 */
		function handleDraggableEnd (data) {
			if (vars.magnetize) {
				moveToPrc(data.prc);
			}
		}
		
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
			else if ((option == "options") && value && (typeof(value) == 'object')) {
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
		 * Log
		 *
		 * @param option Boolean value to wether enable logger or not
		 */
		slidestep.log = function (value) {
			return keyVal('log', value, false);
		};
		
		
		/**
		 * Min
		 *
		 * @param max The min value to get/set
		 */
		slidestep.min = function(value) {
			return keyVal('min', value);
		};
		
		/**
		 * Step
		 *
		 * @param max The max value to get/set
		 */
		slidestep.max = function(value) {
			return keyVal('max', value);
		};
		
		/**
		 * Step
		 *
		 * @param step The step value to get/set
		 */
		slidestep.step = function(value) {
			return keyVal('step', value);
		};
		
		/**
		 * Value/val
		 *
		 * @param value The value to get/set
		 */
		slidestep.value = function(value) {
			var key = 'value';
			if (udf(value)) {
				return slidestep.get(key);
			}
			
			var slide = true,
				val   = value;
			if (typeof(value) == "object") {
				slide = value['slide'];
				val   = value['value'];
			}
			
			// if (isNaN(val)) {
			// 	return;
			// }
			
			if (slide) {
				slideToVal(val);
			}
			else {
				stepToVal(val);
			}
			
		};
		slidestep.val   = slidestep.value; // shortcut notation
		
		/**
		 * Prc
		 *
		 * @param value The percentage value to get/set
		 */
		slidestep.prc = function(value) {
			var key = 'prc';
			if (udf(value)) {
				return slidestep.get(key);
			}
			
			var slide = true, 
				prc   = value;
			if (typeof(value) == "object") {
				slide = value['slide'];
				prc   = value['value'];
			}
			
			// if (isNaN(prc)) {
			// 	return;
			// }
			
			if (slide) {
				slideToPrc(prc);
			}
			else {
				stepToPrc(prc);
			}
			
		};
		
		/**
		 * Items
		 *
		 * @param items The items to get/set, null or empty array to reset to auto build
		 */
		slidestep.items = function (value) {
			var key = 'items'; 
			if (udf(value)) {
				return slidestep.get(key);
			}
				
			var min  = getVar("min"),
				max  = getVar("max"),
				step = getVar("step");
			var items = value,
				isObj = true;
			if (items && items.length > 1){
				try {
					isObj = typeof(items[0]) == "object";
					if (!isObj) {
						var i   = items.length, 
							val = (i - 1) * step;
						for (var i = items.length; i--;) {
							items[i] = {
								prc: items[i],
								val: val
							};
							val -= step;
						}
					}					
					
					if ((items[0].prc != 0) || (items[items.length - 1].prc != 100)) {
						log(items);
						log("prcs goes from 0..100 from the first object to the last object");
						items = null;
					}
				}
				catch(error) {
					log("failed to build with given set of items");
				}
			}
			
			if (items) {
				set.setItems(items);
				if (isObj) {
					// When obj specified by user create shallow copy of objects
					oitems = new Array[items.length];
					for(var n = items.length; n--;) {
						oitems[i] = {
							prc: items[i].prc,
							val: items[i].val
						};
					}
				}
				else {
					oitems = value.concat();
				}
			}
			else {
				set.build(min, max, step);
				oitems = null;
			}
			
			setVar(key, set.items());
			
			// Refresh slidestep
			if (slidestep.grid()) {
				slidestep.grid(true);
			};
			return;
		};
				
		/**
		 * Grid
		 *
		 * @param option Boolean value to wether enable grid or not
		 */
		slidestep.grid = function (value) {
			var key = 'grid'; 
			if (udf(value)) {
				return slidestep.get(key);
			}
			$(el).find('.grid').remove();
			
			if (value) {
				var html = '<div class="grid"></div>';
				$(el).prepend(html);
				
				var offset = slidestep.adjustOffset() ? $(handle).width() : 0;
				$(el).find('.grid').css('right', offset + 'px');	
				
				offset = MathExt.val2prc($(handle).width(), $(rail).width()) / 2;
				$.each(set.items(), function(key, item){
					html   = '<div class="col" style="position: absolute; left: ' + item.prc + '%"></div>';
					$(el).find('.grid').append(html);
					
					html   = '<div class="marker" style="position: absolute; left: ' + (item.prc + offset) + '%"></div>';
					$(el).find('.grid').append(html);
				});
			}
			
			setVar(key, value);
			return;
		};

		/**
		 * Draggable
		 *
		 * @param value  Boolean value to wether enable dragging or not
		 */
		slidestep.draggable = function(value) {
			draggable.enabled(value);
		};
				
		/**
		 * Adjust offset
		 *
		 * @param value  Boolean value to wether adjust offset or not
		 */
		slidestep.adjustOffset = function (value) {
			var key = 'adjustOffset'; 
			if (udf(value)) {
				return slidestep.get(key);
			}
			
			var offset = value ? $(handle).width() : 0;
			$(rail).css('right', offset + 'px');
			
			// Refresh slidestep
			if (slidestep.grid()) {
				slidestep.grid(true);
			};
			
			setVar(key, value);
			return;
		};
		
		/**
		 * Slide on click
		 *
		 * @param value  Boolean value to wether enable slideOnClick or not
		 */
		slidestep.slideOnClick = function (value) {
			var key = 'slideOnClick'; 
			if (udf(value)) {
				return slidestep.get(key);
			}
			
			
			if (value && !meta[key]) {
				$(el).on('click', handleSlideOnClick);
			}
			else if (meta[key]) {
				$(el).off('click', handleSlideOnClick);
			}
			meta[key] = value;
			setVar(key, value);
			return;
		};

		/**
		 * Destroy
		 *	The destroy the current slidestep on this object
		 */
		slidestep.destroy = function() {
			slidestep.slideOnClick(false);
			slidestep.draggable(false);
			
			$(el).removeClass('slidestep');
			$(el).find('.rail').remove();
			$(el).find('.grid').remove();
			
			set 	  = null;
			$.each(["set", "get", "log", "min", "max", "step", "value", "val", "prc", "items", "grid", "draggable", "adjustOffset", "slideOnClick"], function(i, fn){
				slidestep[fn] = null;
			});
			slidestep = null;
			$(el).data('slidestep', null);
		};
		
		// Slidestep: Initialize
		init();
	};
	
	// Slidestep: Default Settings
	Slidestep.defaults = {
		log: false,
		grid: false,
		min: 0,
		max: 100,
		step: 1,
		value: 0,
		items: null,
		easing:  "swing",
		draggable: true,
		adjustOffset: true,
		slideOnClick: false,
		magnetize: false,
		onSlide:  $.noop,
		onStart:  $.noop,
		onChange: $.noop
	};
	
	Slidestep.template = '<div class="rail"><a class="handle"></a></div>';
	
	$.fn.slidestep = function(options) {
		return this.each(function () {
			if (!$(this).data('slidestep')) {
				new Slidestep(this, options);
			}
			else {
				$(this).data('slidestep').set.apply(options, Array.prototype.slice.call( arguments, 1));
			}
		});
	};
})(jQuery); 