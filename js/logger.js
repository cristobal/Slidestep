/*jshint indent:4, laxbreak:true, smarttabs:true */
/**
 * Logger
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
(function () {
	

	/* check if console is present */
	var ciw = ("console" in window);
	
	//--------------------------------------------------------------------------
	//
	//  Logger Class
	//
	//-------------------------------------------------------------------------	
	function Logger() {
		this.enabled = false;
	}
	
	/**
	 * Log
	 */
	Logger.prototype.log = function () {
		if (this.enabled && ciw) {
			try { console.log.apply(console, arguments); }
			catch (error) { /* fail silently console.log not supported */ }	
		}
	};
	
	// Link to window
	window.Logger   = Logger;
})(); 