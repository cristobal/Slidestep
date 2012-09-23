/*jshint indent:4, laxbreak:true, smarttabs:true */
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
 *  - jQuery 1.7 >= (http://jquery.com)
 *  - Set
 *  - Draggable
 **/
// TODO: Use CSS3 Animations when supported.
(function ($) {
	//--------------------------------------------------------------------------
	//
	//  Helper Functions
	//
	//-------------------------------------------------------------------------
	var udf      = function (v) { return typeof(v) === "undefined"; };
	var isTypeof = function (v, t) { return typeof(v) === t; };
	
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
	MathExt.val2prc = function (x, t) {
		return (100 * x) / t;
	};
	
	/**
	 * Percentage to value
	 *
	 * @param p The percentage
	 * @param t The total value equivalent to 100%
	 */
	MathExt.prc2val = function (p, t) {
		return (p * t) / 100;
	};
	

	/* default options */
	var defaults = {
		log: false,
		grid: false,
		min: 0,
		max: 100,
		step: 1,
		value: 0,
		items: null,
		
		draggable: true,
		adjustOffset: true,
		
		slideOnClick: false,
		magnetize: false,
		slideOptions: {
			easing: "swing",
			duration: 400
		},
		magnetizeOptions: {
			easing: "linear",
			duration: 100
		},
		getAnimateOptions: $.noop,
		
		onSlide:  $.noop,
		onStart:  $.noop,
		onChange: $.noop
	};
	/* template  */
	var template = '<div class="rail"><a class="handle"></a></div>';
	
	/* check if console is present */
	var ciw = ("console" in window);
	
	//--------------------------------------------------------------------------
	//
	//  Slidestep 
	//
	//-------------------------------------------------------------------------
	function Slidestep(el, options) {
		var slidestep = null, 
			handle    = null,
			rail	  = null,
			vars	  = null,
			oitems	  = null;
			
		var draggable  = null,
			lastPos    = null,
			lastVal    = 0,
			manual     = true,
			meta       = {},
			set        = new Set(),
			magnetize  = false,
			click      = false,
			events     = {
				start: "onStart",
				slide: "onSlide",
				change: "onChange"
			};
		
		//--------------------------------------------------------------------------
		//
		//  Initialize
		//
		//-------------------------------------------------------------------------		
		function init() {
			vars = $.extend({}, Slidestep.defaults, options);
			$(el).addClass('slidestep')
			     .append(Slidestep.template);
			
			rail   = $(el).find('.rail').get(0);
			handle = $(el).find('.rail .handle').get(0);
			
			$(handle).addClass('unselectable')
			         .attr('unselectable', 'on');
			
			draggable = new Draggable(handle, rail, {
				onChange: handleDraggableChange,
				onStart: handleDraggableStart,
				onEnd: handleDraggableEnd
			});
			
			$.each(["adjustOffset", "items", "grid", "log", "draggable", "slideOnClick"], function (i, key) {
				if (vars.hasOwnProperty(key)) {
					slidestep.set(key, vars[key]);
				}
			});
			
			stepToVal(vars.value);
			$(el).data('slidestep', slidestep);
		}
		
		
		//--------------------------------------------------------------------------
		//
		//  Private Functions
		//
		//-------------------------------------------------------------------------
		
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
			if (vars[cb] && isTypeof(vars[cb], "function")) {
				return vars[cb](data);
			}
			
			return;
		}
		
		/**
		 * Set var
		 *
		 * @param value
		 */
		function setVar(key, value) { vars[key] = value; }
		
		/**
		 * Get var
		 *
		 * @param key The option parameter value we want to retrieve
		 */
		function getVar(key) {
			if (key === "options") {
				return $.extend({}, vars); // get shallow copy of all options
			}
			
			if (!vars.hasOwnProperty(key)) {
				return null;
			}
			
			var value = vars[key];
			if (isTypeof(value, 'object') && !isTypeof(value.concat, "function")) {
				value = $.extend({}, value); // return shallow copy if object (not array)
			}
			
			return value;
		}
		
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
		
		/**
		 * Notify and update pos
		 *
		 * @param type
		 * @param new pos
		 * @param update
		 */
		function notify(type, pos, update) {
			if (udf(update)) {
				update = true;
			}
			var data = {
				pos: pos,
				lastPos: lastPos
			};
			if (update) {
				data.pos = $.extend({}, data.pos); // shallow copy
			}

			call(events[type], data);
			if (update) {
				lastPos = pos;
			}
		}
		
		//--------------------------------------------------------------------------
		//
		//  Step/Slide Functions
		//
		//-------------------------------------------------------------------------
		
		/**
		 * Moveto
		 *
		 * @param prc
		 * @param val
		 * @param animate
		 */
		function moveTo(prc, val, animate) {
			log("moveTo", prc, val, animate);
			var options = null,
				pos     = {val: val, prc: prc, index: set.findIndexByPrc(prc)},
				cpos    = {val: val, prc: prc, index: pos.index}, // shallow copy to pass around
				data    = {
					pos: cpos,
					lastPos: lastPos,
					magnetize: magnetize,
					animate: animate,
					click: click
				};
				
			// handle magnetize case
			if (magnetize) {
				
				if (data.lastPos) {
					animate      =  data.lastPos.index != data.pos.index;
					data.animate = animate;
				}
				
				options = call("getAnimateOptions", data);
				if (udf(options) && animate) {
					options = $.extend({}, vars.magnetizeOptions);
				}
				
				if (!options) {
					animate = false;
				}
			}
			else if (animate) {
				options = call("getAnimateOptions", data);
				if (udf(options) && animate) {
					options = $.extend({}, vars.slideOptions);
				}
				
				if (!options) {
					animate = false;
				}
			}
			
			if (animate) {
				$(handle).animate({
					left: prc + "%"
				}, options);
			}
			else {
				$(handle).css('left', prc + "%");
			}
			
			setVar("prc", prc);
			setVar("value", val);
			notify("change", pos);
			lastVal = val;
		}
		
		/**
		 * Move to prc
		 *
		 * @param prc
		 * @param animate
		 */
		function moveToPrc(prc, animate) {
			log("moveToPrc", prc);
			var val = set.findVal(prc);		// 1. Find the equivalent val
			prc     = set.findPrcByVal(val);// 2. Snap prc by val
			moveTo(prc, val, animate);		// 3. Move to
		}
		
		/**
		 * Move to val
		 *
		 * @param val
		 * @param animate
		 */
		function moveToVal(val, animate) {
			log("moveToVal", val);
			var prc = set.findPrc(val);		// 1. Find the equivalent prc
			val     = set.findValByPrc(prc);// 2. Snap value by prc
			moveTo(prc, val, animate);		// 3. Move to
		}
			
		/**
		 * Step to
		 *
		 * @param value Percentage from 0..100
		 */
		function stepTo(prc, val) {
			moveTo(prc, val, false);
		}
		
		/**
		 * Step to prc
		 *
		 * @param prc
		 */
		function stepToPrc(prc) {
			moveToPrc(prc, false);
		}
		
		/**
		 * Step to val
		 *
		 * @param val
		 */
		function stepToVal(val) {
			moveToVal(val, false);
		}
	
		/**
		 * Slide to
		 *
		 * @param value Percentage from 0..100
		 */
		function slideTo(prc, val) {
			moveTo(prc, val, true);
		}
		
		/**
		 * Slide to prc
		 *
		 * @param prc
		 */
		function slideToPrc(prc) {
			moveToPrc(prc, true);
		}
		
		/**
		 * Slide to val
		 *
		 * @param val
		 */
		function slideToVal(val) {
			moveToVal(val, true);
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
		function handleSlideOnClick(event) {
			if ((event.target === handle) || !event) {
				return;
			}
			
			var x = event.offsetX;
			if (udf(x)) {
				x = event.clientX - $(el).offset().left;
			}

			var prc = MathExt.val2prc(x, $(el).width()),
				val = set.findVal(prc);
			if (vars.magnetize) {
				prc = set.findPrcByVal(val);
			}
			var pos = {
				val: val
			};
			pos.prc   = magnetize ? set.findPrcByVal(val) : prc;
			pos.index = set.findIndexByPrc(pos.prc);
			notify("slide", pos, false);
			
			click = true;
			moveTo(prc, val, true);
			click = false;
		}
		
		/**
		 * Handle draggable start
		 *
		 * @param data
		 */
		function handleDraggableStart(data) {
			var prcX = data.pos.prcX;
			var pos = {
				val: set.findVal(prcX)
			};
			pos.prc   = magnetize ? set.findPrcByVal(val) : prcX;
			pos.index = set.findIndexByPrc(pos.prc);
			notify("start", pos);
		}
		
		/**
		 * Handle draggable change
		 *
		 * @param data
		 */
		function handleDraggableChange(data) {
			var prcX = data.pos.prcX;
			var pos  = {
				val: set.findVal(prcX)
			};
			pos.prc   = magnetize ? set.findPrcByVal(val) : prcX;
			pos.index = set.findIndexByPrc(pos.prc);
			
			if (pos.val != lastVal) {
				notify("change", pos, false);
				lastVal = pos.val;
				manual  = false;
			}
		}
		
		/**
		 * Handle draggable end
		 *
		 * @param event
		 */
		function handleDraggableEnd(data) {
			var prcX = data.pos.prcX;
			if (vars.magnetize) {
				magnetize = true;
				moveToPrc(prcX, false);
				magnetize = false;
			}
			else {
				var pos = {
					val: set.findVal(prcX)
				};
				pos.prc   = prcX;
				pos.index = set.findIndexByPrc(pos.prc);
				
				if (pos.val != lastVal) {
					notify("change", pos);
					
					setVar("prc", pos.prc);
					setVar("value", pos.val);
					
					lastVal = pos.val;
					manual  = false;
				}
			}
		}
		
		//--------------------------------------------------------------------------
		//
		//  Public Functions
		//
		//-------------------------------------------------------------------------
		
		slidestep =  {
			
			/**
			 * Set
			 *
			 * @param option The option value to set
			 * @param value	 The value for the option
			 */
			set: function (option, value) {
				if ((option in slidestep) && isTypeof(slidestep[option], "function")) {
					slidestep[option](value);
				}
				else if ((option === "options") && isTypeof(value, 'object')) {
					for (option in value) {
						slidestep.set(option, value[option]);
					}
				}
			},
		
			/**
			 * Get
			 *
			 * @param option The option value to get
			 */	
			get: function (option) {
				return getVar(option);
			},
			
			/**
			 * Log
			 *
			 * @param option Boolean value to wether enable logger or not
			 */
			log: function (value) {
				return keyVal('log', value, false);
			},
			
			/**
			 * Min
			 *
			 * @param min The min value to get/set
			 */
			min: function (value) {
				return keyVal('min', value);
			},
			
			/**
			 * Max
			 *
			 * @param max The max value to get/set
			 */
			max: function (value) {
				return keyVal('max', value);
			},
			
			/**
			 * Step
			 *
			 * @param step The step value to get/set
			 */
			step: function (value) {
				return keyVal('step', value);
			},
			
			/**
			 * Value/val
			 *
			 * @param value The value to get/set
			 */
			value: function (value) {
				var key = 'value';
				if (udf(value)) {
					return slidestep.get(key);
				}
			
				var slide = true,
					val   = value;
				if (isTypeof(value, "object")) {
					slide = value.slide;
					val   = value.value;
				}
			
				if (slide) {
					slideToVal(val);
				}
				else {
					stepToVal(val);
				}
				manual = true;
				setVar(key);
			},
			val: this.value,	// shortcut notation
			
			/**
			 * Prc
			 *
			 * @param value The percentage value to get/set
			 */
			prc: function (value) {
				var key = 'prc';
				if (udf(value)) {
					return slidestep.get(key);
				}
				var slide = true, 
					prc   = value;
				if (isTypeof(value, "object")) {
					slide = value.slide;
					prc   = value.value;
				}
				
				if (slide) {
					slideToPrc(prc);
				}
				else {
					stepToPrc(prc);
				}
			},
			
		
			/**
			 * Items
			 *
			 * @param items The items to get/set, null or empty array to reset to auto build
			 */
			items: function (value) {
				var key = 'items'; 
				if (udf(value)) {
					return slidestep.get(key);
				}
				
				var i, val,
					min  = getVar('min'),
					max  = getVar('max'),
					step = getVar('step');
				var items = value,
					isObj = true;
				if (items && items.length > 1) {
					try {
						isObj = isTypeof(items[0], "object");
						if (!isObj) {
							i   = i = items.length;
							val = (i - 1) * step;
							for (; i--;) {
								items[i] = {
									prc: items[i],
									val: val
								};
								val -= step;
							}
						}
						if ((items[0].prc !== 0) || (items[items.length - 1].prc !== 100)) {
							log("prcs goes from 0..100 from the first object to the last object");
							items = null;
						}
					}
					catch (error) {
						log("failed to build with given set of items");
					}
				}
				
				if (items) {
					set.setItems(items);
					if (isObj) {
						// When obj specified by user create shallow copy of objects
						oitems = new Array(items.length);
						for (i = items.length; n--;) {
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
				}
				return;
			},
			
			/**
			 * Grid
			 *
			 * @param option Boolean value to wether enable grid or not
			 */
			grid: function (value) {
				var key = 'grid'; 
				if (udf(value)) {
					return slidestep.get(key);
				}
				$(el).find('.grid').remove();
			
				if (value) {
					$(el).prepend('<div class="grid"></div>');
					
					var $grid    = $(el).find('.grid');
					var template = function (className, prc) { return '<div class="' + className + '" style="position: absolute; left: ' + prc + '%"></div>'; };
					var offset   = slidestep.adjustOffset() ? $(handle).width() : 0;
					$grid.css('right', offset + 'px');	
				
					offset = MathExt.val2prc($(handle).width(), $(rail).width()) / 2;
					$.each(set.items(), function (key, item) {
						$grid.append(template('col', item.prc))
						     .append(template('marker', item.prc + offset));
					});
				}
			
				setVar(key, value);
				return;				
			},
			
			/**
			 * Draggable
			 *
			 * @param value  Boolean value to wether enable dragging or not
			 */			
			draggable: function (value) {
				return draggable.enabled(value);
			},
			
			/**
			 * Adjust offset
			 *
			 * @param value  Boolean value to wether adjust offset or not
			 */
			adjustOffset: function (value) {
				var key = 'adjustOffset'; 
				if (udf(value)) {
					return slidestep.get(key);
				}
			
				var offset = value ? $(handle).width() : 0;
				$(rail).css('right', offset + 'px');
				
				setVar(key, value);
				
				// Refresh slidestep
				if (slidestep.grid()) {
					slidestep.grid(true);
				}
				return;				
			},
			
			/**
			 * Magnetize
			 *
			 * @param option Boolean value to wether enable magnetize or not
			 */
			magnetize: function (value) {
				return keyVal('magnetize', value, false);
			},
			
			/**
			 * Slide on click
			 *
			 * @param value  Boolean value to wether enable slideOnClick or not
			 */
			slideOnClick: function (value) {
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
			},
			
			/**
			 * Destroy
			 *	Destroy the current slidestep on this object
			 */
			destroy: function () {
				$(el).data('slidestep', null);		
				
				draggable.destroy();
				slidestep.slideOnClick(false);
			
				$(el).removeClass('slidestep');
				$(el).find('.rail').remove();
				$(el).find('.grid').remove();

				handle	  = null;
				rail      = null;
				vars      = null;
				oitems    = null;				
				
				draggable = null;
				meta      = null;
				set       = null;

				slidestep = null;
			}
		};	
		
		init();
	}
	
	// Link Slidestep
	Slidestep.defaults = defaults;
	Slidestep.template = template;
	window.Slidestep   = Slidestep;
	
	// Create jQuery plugin link
	$.fn.slidestep = function (options) {
		return this.each(function () {
			if (!$(this).data('slidestep')) {
				new Slidestep(this, options);
			}
			else {
				$(this).data('slidestep').set.apply(options, Array.prototype.slice.call(arguments, 1));
			}
		});
	};
})(jQuery); 