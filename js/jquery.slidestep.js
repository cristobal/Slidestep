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
	//  Helper Lambda Functions
	//
	//-------------------------------------------------------------------------
	var udf   = function(v) { return typeof(v) == "undefined"; };
	
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
	//  Array extensions
	//
	//-------------------------------------------------------------------------
	var ArrayExt = {};
	
	/**
	 * Range
	 * 
	 * @param start
	 * @param limit
	 * @oaram step
	 */
	ArrayExt.range = function(start, limit, step) {
		if (udf(step)) {
			step = 1;
		}
		
		var items = [];
		for (var value = start; value <= limit; value += step) {
			items.push(value);
		}
		
		return items;
	};

	
	//--------------------------------------------------------------------------
	//
	//  HashMap
	//
	//-------------------------------------------------------------------------
	// HashMap: Object instance
	function HashMap() {
		var data = {};
		return {
			del: function (key) {
				if (data.hasOwnProperty(key)) {
					delete data[key];
				}
			},
			
			get: function(key) {
				return data.hasOwnProperty(key) ? data[key] : null;
			},
			
			set: function(key, value) {
				data[key] = value;
			}
			
		};
	}
	
	
	//--------------------------------------------------------------------------
	//
	//  Set
	//
	//-------------------------------------------------------------------------
	// Set: Object instance
	function Set() {
		var items = [],
			PL = {},
			VL = {};
		// normalize step by -1 since ArrayExt.range will return +1 item 
		// due do <= condition in most cases
		var P     = function(limit, size) { return Math.round(limit / (size - 1)); };  
	
		return {
		
			/**
			 * Build set
			 *
			 * @param from
			 * @param to
			 * @param step
			 */ 
			build: function(from, to, step) {
				var values = ArrayExt.range(from, to, step),
					i  = 0,
					l  = 100,
					s  = P(l, values.length),
					prcs   = ArrayExt.range(i, l, s);  
			
				// should the cas be that the prcs.length be an item less than the values we append the last value
				if (prcs.length < values.length) {
					prcs.push(l);
				}
				
				PL = {}; VL = {};
				items = new Array(prcs.length);
				for (i = items.length; i--;) {
					items[i] = {
						prc: prcs[i],
						val: values[i]
					};
					PL[values[i]] = prcs[i];
					VL[prcs[i]]   = values[i];
				}
			},
			
			/**
			 * Get items
			 */
			items: function() {
				
				// return shallow copy
				var c = new Array(items.length);
				for (var i = items.length; i--;) {
					c[i] = {
						prc: items[i].prc,
						val: items[i].val
					};
				}
				return c; 
			},
			
			/**
			 * Find val
			 *
			 * @param prc
			 */
			findVal: function(prc) {
				var s  = P(100, items.length),	// 1. find step `s`
					m  = prc % s,				// 2. find modulo diff `m`
					v  = prc - m,				// 3. find nearest value `v`, which is the prc less the modulo
					v2 = v + s,					// 4. find next value `v2`, which is `v + s`
					d  = m,						// 5. find distance `d` for `v`, which is the distance for `prc` from `v`
					d2 = v2 - prc;				// 6. find distance `d2` for `v2`, which is the distance for `prc` from `v2`
				return d < d2 ? v : v2;			// 7. return `v` if `prc` is closer to `v` by d, otherwise return v2.
			},
			
			/**
			 * Find val by prc
			 * 	Fast lookup
			 *
			 * @param prc
			 */
			findValByPrc: function (prc) {
				return (VL.hasOwnProperty(prc) ? VL[prc] : NaN);
			},
			
			/**
			 * Find prc
			 *
			 * @param val
			 */
			findPrc: function(val) {
				var i  = 0,						// 1. set `i` to 0 
					k  = items.length - 1, 		// 2. get `k` 
					v  = items[i].val,			// 3. set `v`  to `items[0]`
					v2 = items[k].val,			// 4. set `v2` to `items[k]`
					s  = (v2 - v) / k;			// 5. set `s`  to the step value for the items  
				
				if (val >= v2) {				// 6. if `val` greater than last value `v2` `
					i = k;						//    	fix `i` to `k
				}
				else if (val > v){				// 7. if `val` greater than first value `v` 
					i = Math.round((val - v) / s); // 	round `i` to nearest key `i` 
				}
			
				return items[i].prc;			// return `prc` present in item[i]; 
												// defaults to first item in the array if none of the  conditions 6 & 7 incur.
			},
			
			/**
			 * Find prc by val
			 *	Fast lookup
			 *
			 * @param val
			 */
			findPrcByVal: function (val) {
				return (PL.hasOwnProperty(val) ? PL[val] : NaN);
			}
		};
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
			vars	  = null;
			
			var descriptors = {
				grid: 'boolean',
				easing: 'string',
				adjustOffset: 'boolean',
				slideOnClick: 'boolean'
			};
			
			var meta  = new HashMap();
			var set	  = new Set();
			var ciw   = ("console" in window);
			 
		// slidestep DOM reference for use outside of the plugin
		$.data(el, "slidestep", slidestep);
		
		function init() {
			vars = $.extend({}, Slidestep.defaults, options);
			$(el).addClass('slidestep')
				 .append(Slidestep.template);

			rail   = $(el).find('.rail').get(0);
			handle = $(el).find('.rail .handle').get(0);
			
			$(handle).attr('unselectable', 'on');
			
			set.build(vars.min, vars.max, vars.step);			
			$.each(["adjustOffset", "grid", "log", "slideOnClick"], function(i, key) {
				if (vars[key]) {
					slidestep.set(key, true);
				}
			});
			
			stepToVal(vars.value);
		};
		
		/**
		 * Log wrapper
		 */
		function log() {
			if (meta.get('log') && ciw) {
				try { console.log.apply(console, arguments); }
				catch(error) { /* fail silently console.log not supported */ }
			}
		}
		
		
		/**
		 * Set val
		 *
		 * @param value
		 */
		function setVal (value) { vars.value = value; };
		
		/**
		 * Get val
		 *
		 * @param
		 */		
		function getVal () { return vars.value ? vars.value : vars.min; };
		
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
				case 'string': {
					vars[key] = String(value);
					break;
				}
			}			
			
			return vars[key];
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
			slideToPrc(prc);
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
		 * Log
		 *
		 * @param option Boolean value to wether enable logging or not
		 */
		slidestep.log = function (value) {
			var key = 'log'; 
			if (udf(value)) {
				return slidestep.get(key);
			}
			
			setVar(key, value);
			meta.set(key, value);
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
			
			setVar(key, value);
			if (value) {
				var html = '<div class="grid"></div>';
				$(el).prepend(html);
				
				var offset = slidestep.adjustOffset() ? $(handle).width() : 0;
				$(el).find('.grid').css('right', offset + 'px');	
				
				$.each(set.items(), function(key, item){
					html = '<div class="col" style="position: absolute; left: ' + item.prc + '%"></div>';
					$(el).find('.grid').append(html);
				});
			}
			
			meta.set(key, value);
			return;
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
			
			setVar(key, value);
			meta.set(key, value);
			
			var offset = value ? $(handle).width() : 0;
			$(rail).css('right', offset + 'px');
			
			// Refresh slidestep
			if (slidestep.grid()) {
				slidestep.grid(true);
			};
			
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
			
			setVar(key, value);
			if (value && !meta.get(key)) {
				$(el).on('click', handleSlideOnClick);
			}
			else if (meta.get(key)) {
				$(el).off('click', handleSlideOnClick);
			}
			
			meta.set(key, value);
			return;
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
		easing:  "swing",
		adjustOffset: true,
		slideOnClick: false,
		onSlide:  jQuery.noop,
		onStart:  jQuery.noop,
		onChange: jQuery.noop
	};
	
	Slidestep.template = '<div class="rail"><a class="handle" href="#"></a></div>';
	
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