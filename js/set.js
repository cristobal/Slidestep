/*jshint indent:4, laxbreak:true, smarttabs:true */
/**
 * Set - Class that contains a range(start, limit, step) of values 
 *		 that are mapped to an set of equivalent percentages from 0..100.
 *		 These values and prcs are represent as an set of items [{prc: %, val: n}, … ] 
 *
 *
 * #### Simple Example
 *
 *		// 1. Build the set
 *		var s = new Set();
 *			s.build(40, 80, 8); 
 *		
 *		// 2. Inspect the values and prcs
 *		s.values()	=> [ 40, 48, 56, 64, 72, 80  ] // The resulting values
 *		s.prcs()	=> [  0, 20, 40, 60, 80, 100 ] // The mapped prcs
 *
 *		// 3. Finding nearest val & prc for the val = 35, prc = 60
 *		s.findVal(35)	=> 56	// The result val corresponds to the percentage value 40 which 35 is closest to in the prcs list
 *		s.findPrc(65)	=> 60	// The result prc corresponds to the value 64 which 65 is closest to in the values list
 *
 *		// 4. Finding nearest prc & val for the results from above prc = 56, prc = 60
 *		s.findPrc(56)	=> 40	
 *		s.findVal(60)	=> 64	
 *
 *		// 5. We can also find the same result using the map lookup functions
 *		//    which are faster and gives us the same result as in step 4,
 *		//    since the result values from step3 are exact values for the val & prc.
 *		s.findValByPrc(60)	=> 64	
 *		s.findPrcByVal(56)	=> 40	
 *
 *
 *
 * #### Example with predifined set
 *		(It is also possible to build an set which has an predifined set of items)
 *
 *		// 1. Build the set
 *		var s2 = new Set();
 *			s2.setItems([
 *				{prc: 0, val: 3}, 
 *				{prc: 25, val: 9},
 *				{prc: 80, val: 27},
 *				{prc: 100, val: 81}
 *			]); // Note: the values & prcs must be set in asc order
 *
 *		// 2. Inspect the values and prcs
 *		s2.values() => [ 3, 9, 27, 81  ]	// The values set
 *		s2.prcs()	=> [  0, 25, 80, 100 ]	// The prcs set; for consistency please set prcs from 0..100
 *
 *		// 3. Finding nearest val & prc for the val = 35, prc = 60
 *		s2.findVal(35)	=> 27	// The result val corresponds to the percentage value 25 which 35 is closest to in the prcs list
 *		s2.findPrc(65)	=> 100	// The result prc corresponds to the value 81 which 65 is closest to in the values list
 *	
 *	
 *	
 * Written by
 * Cristobal Dabed (cristobal@dabed.org)
 *
 * Licensed under the MIT (MIT-LICENSE.txt).
 *
 * @author Cristobal Dabed
 * @version 0.1
 * 
 **/
(function () {
	
	//--------------------------------------------------------------------------
	//
	//  Helper methods
	//
	//-------------------------------------------------------------------------	
	/* check if variable is undefined */
	var udf = function (v) { return typeof(v) === "undefined"; };
		
	/* normalize step by -1 since range range will return +1 item in most cases due to the <= condition */
	var ns = function (limit, size) { return Math.round(limit / (size - 1)); };
	
	/**
	 * Range
	 *
	 * @param start Start value
	 * @param limit Limit value
	 * @param step  Optional step (default 1)
	 */
	var range = function (start, limit, step) {
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
	//  Set Class
	//
	//-------------------------------------------------------------------------	
	function Set() {
		var L  = [],	// List `L` of {prc: %, val: n} items 
			PL = {},	// Map(hash) of percentage values to lookup by a value
			VL = {},	// Map(hash) of values to lookup by a percentage value
			D  = {
				prc: true,
				val: true
			};
	
		//--------------------------------------------------------------------------
		//
		//  Private methods
		//
		//-------------------------------------------------------------------------	
		
		/**
		 * Find index val
		 *
		 * @param val
		 * @param prop prc|val
		 */
		function findIndexBy(val, prop) {
			var index = -1;
			for (var i = L.length; i--;) {
				if (L[i][prop] == val) {
					index = i;
					break;
				}
			}
			return index;
		}
	
		/**
		 * Find nearest
		 *
		 * @param val
		 * @param prop prc|val
		 * @param up   Optional defaults to true
		 */
		function findNearest(val, prop, up) {
			if (L.length === 0) {
				return null;
			}
		
			if (udf(up)) {
				up = true;
			}

			if (!D[prop]) {
				return findNearest2(val, prop, up);
			}
			
			var i	= 0,				// 1. set `i` to 0 
				k	= L.length - 1,		// 2. get `k` 
				v	= L[i][prop],		// 3. set `v`  to `L[0]`
				v2	= L[k][prop],		// 4. set `v2` to `L[k]`
				s	= (v2 - v) / k;		// 5. set `s`  to the step value for the list `L`  
					
			if (val >= v2) {			// 6. if `val` greater than last value `v2` `
				i = k;					//		fix `i` to `k
			}
			else if (val > v) {			// 7. if `val` greater than first value `v` 
				i = Math.round((val - v) / s);	// round `i` to nearest key `i` 
				if (!up) {
					var d  = val - L[i - 1][prop],
						d2 = L[i][prop]  - val;
					if (d === d2) {
						i--;
					}
				
				}
			}
				
			return L[i];			// 8. return `prc` present in the list L[i]; 
									//    defaults to first item in the list `L` if none of the  conditions 6 & 7 incur.		
		}
	
		/**
		 * Find nearest2 
		 *
		 * @param val
		 * @param prop prc|val
		 * @param up   true|false
		 */
		function findNearest2(val, prop, up) {
			var i	= 0, 
				k	= L.length - 1,
				v	= L[i][prop],
				v2	= L[k][prop];
			
			if (val >= v2) {
				i = k;
			}
			else if (val > v) {
				// find nearest in between or exact match
				var d, d2;
				for (; k--;) {
					v = L[k][prop];
					if ((val >= v) && (val <= v2)) {
						d  = val - v;
						d2 = v2  - val;
						if (up) {
							i   = k + (d < d2 ? 0 : 1);
						}
						else {
							i   = k + (d <= d2 ? 0 : 1);
						}
						break;
					}
					v2 = v;
				}
			}
			
			return L[i];		
		}
	
		/**
		 * Copy items 
		 *
		 * @param prop all|prc|val
		 */
		function copyItems(prop) {
			var c = new Array(L.length), 
				a = (prop === "all");
			for (var i = L.length; i--;) {
				if (a) {
					c[i] = {
						prc: L[i].prc,
						val: L[i].val
					};
				}
				else {
					c[i] = L[i][prop];	
				}
			}
			return c;
		}
	
	
		//--------------------------------------------------------------------------
		//
		//  Public API
		//
		//-------------------------------------------------------------------------
		return {
	
			/**
			 *
			 * Build the set 
			 *
			 * @param from	The start value 
			 * @param to	The limit value
			 * @param step	Optional step value if none set default 1. 
			 */
			build: function (from, to, step) {
				var values	= range(from, to, step),
					i		= 0,
					l		= 100,
					s		= ns(l, values.length),
					prcs	= range(i, l, s);  
				
				// should the case be that the prcs.length be an item less than the values we append the last value
				if (prcs.length < values.length) {
					prcs.push(l);
				}
			
				PL = {};
				VL = {};
				L  = new Array(prcs.length);
				for (i = L.length; i--;) {
					L[i] = {
						prc: prcs[i],
						val: values[i]
					};
					PL[values[i]] = prcs[i];
					VL[prcs[i]]   = values[i];
				}	
			
				D.prc = true; // distributed	
				D.val = true; // distributed
			},
		
			/** 
			 * Get items
			 *
			 * @return Returns a list of the values
			 */
			values: function () {	
				return copyItems('val');	
			},
		
			/** 
			 * Get percentages
			 *
			 * @return Returns a list of percentage values
			 */
			prcs: function () {
				return copyItems('prc');		
			},
		
			/** 
			 * Get items
			 *
			 * @return Returns a shallow copy of the list of {prc: %, val: n} items
			 */
			items: function () {
				return copyItems('all');
			},
		
			/**
			 * Set items
			 *
			 * @param items
			 */
			setItems: function (items) {
				D.prc = true; // asume distributed	
				D.val = true; // asume distributed
			
				PL = {};	
				VL = {};
				L  = new Array(items.length);
				var i, prc, val, prc2, val2;
				var pdc = 0, ps = {},
					vdc = 0, vs = {};
				for (i = L.length; i--;)  {
					prc = items[i].prc;
					val = items[i].val;
					L[i] = {
						prc: prc,
						val: val
					};
					PL[val] = prc;
					VL[prc] = val;
	
	
					if (prc2 && D.prc) {
						prc2 = prc2 - prc;
						if (!ps[prc2]) {
							pdc++;
							ps[prc2] = true;	
						}
					}
					if (val2 && D.val) {
						val2 = val2 - val;
						if (!vs[val2]) {
							vdc++;
							vs[val2] = true;	
						}

					}
	
					prc2 = prc;
					val2 = val;
				}
			
				D.prc = pdc <= 1; // distributed only if the distance between all prcs is the same 
				D.val = vdc <= 1; // distributed only if the distance between all values is the same
			},
		
			/**
			 * Find val
			 *	Find a value that matches the percentage value passed 
			 *
			 * @param prc The percentage value to match a value on.
			 * @param up  Optional param up defaults to true, if distance is same it will round up. 
			 *            Set to false if you want to round down.
			 *
			 * @return	Returns a val that corresponds to the given percentage. 
			 *			If there are no items NaN is returned
			 */
			findVal: function (prc, up) {
				var item = findNearest(prc, 'prc', up);
				return item ? item.val : null;
			},
		
			/**
			 * Find val by prc
			 *	Map(hash) lookup to find a value that matches the percentage value passed.
			 *  
			 *  Example:
			 *		1. Use findPrc with an value to find an matching percentage value. 
			 *		2. Then lookup the exact value that corresponds to the percentage value returned in 1.
			 *
			 * @param prc The percentage value to match a value on.
			 * @return Returns a val if the val is present in the Map otherwise null
			 */
			findValByPrc: function (prc) {
				return (VL.hasOwnProperty(prc) ? VL[prc] : null);
			},
			
			/**
			 * Find index by prc
			 *
			 * @param prc The percentage value to find the index on.
			 * @return Returns a index if the prc value is present in the items otherwise -1
			 */			
			findIndexByPrc: function (prc) {
				return findIndexBy(prc, 'prc');
			},
		
			/**
			 * Find prc
			 *	Find a percentage value that matches the value passed 
			 *
			 * @param val The value to match a percentage value on.
			 * @param up  Optional param up defaults to true, if distance is same it will round up. 
			 *            Set to false if you want to round down.
			 *
			 * @return	Returns a prc that corresponds to the given value. 
			 *			If there are no items null.
			 */
			findPrc: function (val, up) {
				var item = findNearest(val, 'val', up);
				return item ? item.prc : null;
			},
		
			/**
			 * Find prc by val
			 *	Map(hash) lookup to find a percentage value that matches the value passed.
			 *  
			 *  Example:
			 *		1. Use findVal with an percentage value to find an matching value. 
			 *		2. Then lookup the exact percentage value that corresponds to the value returned in 1.
			 *
			 * @param val The percentage value to match a value on.
			 * @return Returns a prc if the val is present in the Map otherwise null
			 */
			findPrcByVal: function (val) {
				return (PL.hasOwnProperty(val) ? PL[val] : null);
			},
			
			/**
			 * Find index by val
			 *
			 * @param val The value to find the index on.
			 * @return Returns a index if the val is present in the items otherwise -1
			 */	
			findIndexByVal: function (val) {
				return findIndexBy(val, 'val');
			}
		};	
	}

	window.Set = Set;
})(); 