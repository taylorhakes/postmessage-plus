(function (global, undefined) {
	'use strict';
	/**
	 * Send and Receive message from other windows
	 * @param [options] {object}
	 * @param [options.listenDomain] {string|Array} Domain(s) to listen to messages from
	 * @param [options.sendDomain] {string} Default send domain. Can specify message specific domain in `send` method
	 * @param [options.timeout] {number} Milliseconds to wait for a response when sending a message
	 * @constructor
	 */
	function PMPlus(options) {
		options = options || {};
		if (options.listenDomain && Object.prototype.toString.call(options.listenDomain) !== '[object Array]') {
			options.listenDomain = [options.listenDomain];
		}
		this._timeout = options.timeout || 3000;
		this._listenTimeout = options.listenTimeout || 100;
		this._sendD = options.sendDomain;
		this._listenD = options.listenDomain || [];
		this._listeners = {};
		this._rListeners = {};
	}

	/**
	 * Send a message to another window
	 * @param params.w {Window} Window to send message
	 * @param params.channel {string} Channel to send the message
	 * @param params.data {*} Data to send
	 * @param [params.domain] {string} Override default send domain
	 * @param [params.callback] {Function} Callback to be executed when other window responds
	 *        Has the form:  function(success, data) { }
	 */
	PMPlus.prototype.send = function (params) {
		var info = {
				id: Math.random(),
				channel: params.channel,
				data: params.data,
				type: 'message'
			}, me = this, domain = params.domain || this._sendD, timeout, listenTimeout;

		if (!this._sendD && !params.domain) {
			throw new Error('Must specify domain to send message. Default in Constructor or message specific.');
		}
		if (!this._rListeners[params.channel]) {
			this._rListeners[params.channel] = {};
		}

		sendMessage(params.w, info, domain);
		addEvent.call(this);
		if (!this._rListeners[params.channel][info.id] && params.callback) {
			timeout = setTimeout(function () {
				clearTimeout(listenTimeout);
				params.callback(false, 'Timeout');
				delete me._rListeners[params.channel][info.id];
			}, this._timeout);
			listenTimeout = setTimeout(function () {
				params.callback(false, 'No listener');
				delete me._rListeners[params.channel][info.id];
			}, this._listenTimeout);
			this._rListeners[params.channel][info.id] = {
				timeout: timeout,
				listenTimeout: listenTimeout,
				callback: params.callback,
				domain: domain
			};
		}
	};

	/**
	 * Listen to a specific channel
	 * @param channel {string} Channel to listen
	 * @param callback {Function} Function to call when someone sends a message on the channel
	 * 		has the form: function(data {*}, respond {Function}) { ... }
	 */
	PMPlus.prototype.listen = function (channel, callback) {
		if(!this._listenD.length) throw new Error('Not listening to any domains. Specify domains in Constructor.');
		addEvent.call(this);
		if (!this._listeners[channel]) {
			this._listeners[channel] = [];
		}
		this._listeners[channel].push(callback);
	};

	/**
	 * Remove all events and stop listening to messages
	 * @type {Function}
	 */
	PMPlus.prototype.destroy = removeEvent;

	PMPlus.prototype._onMessage = function (e) {
		var info, response, update, k, len, keys, i, responded = false, onRespond, isListen = checkListenDomain.call(this,
				e.origin), isResponse = checkResponseDomain.call(this, e.origin);

		// Ignore messages from bad domains
		if (!isListen && !isResponse) {
			return;
		}

		try {
			info = JSON.parse(e.data);
		} catch (error) {
			// Some other way of sending data, ignore
			return;
		}

		if (info.type === 'message' && isListen) {

			onRespond = function (success, data) {
				// Don't respond twice
				if (responded) return;

				responded = true;
				response.success = success;
				response.data = data;
				sendMessage(e.source, response, e.origin);
			};
			response = {
				id: info.id,
				channel: info.channel,
				type: 'response',
				success: true
			};
			if (!this._listeners[info.channel]) {
				onRespond(false, 'Invalid Channel: `' + info.channel + '`');
				return;
			}
			for (i = 0, len = this._listeners[info.channel].length; i < len; i++) {
				try {
					this._listeners[info.channel][i](info.data, onRespond);
					// Update the sender to say their message was received and is processing
					if(!responded) {
						update = {
							id: info.id,
							channel: info.channel,
							type: 'listening'
						};
						sendMessage(e.source, update, e.origin);
					}
				} catch (error) {
					onRespond(false, 'Unknown Error');
				}
			}
		} else if(this._rListeners[info.channel] && this._rListeners[info.channel][info.id] && this._rListeners[info.channel][info.id].domain === e.origin) {
			if(info.type === 'listening') {
				clearTimeout(this._rListeners[info.channel][info.id].listenTimeout);
			} else if(info.type === 'response') {
				clearAllTimeouts(this._rListeners[info.channel][info.id]);
				this._rListeners[info.channel][info.id].callback(info.success, info.data);
				delete this._rListeners[info.channel][info.id];

				keys = false;
				for (k in this._rListeners[info.channel]) {
					keys = true;
					break;
				}
				if (!keys) delete this._rListeners[info.channel];
			}
		}
	};

	function sendMessage(w, info, domain) {
		w.postMessage(JSON.stringify(info), domain);
	}

	function clearAllTimeouts(obj) {
		clearTimeout(obj.listenTimeout);
		clearTimeout(obj.timeout);
	}

	function checkListenDomain(domain) {
		/*jshint validthis: true */
		for (var i = 0, len = this._listenD.length; i < len; i++) {
			if (domain === this._listenD[i] ||
				(this._listenD[i] instanceof RegExp && domain.match(this._listenD[i]))) {
				return true;
			}
		}
		return false;
	}

	function checkResponseDomain(domain) {
		/*jshint validthis: true */
		if (this._sendD === domain) return true;
		for (var channel in this._rListeners) {
			for (var message in this._rListeners[channel]) {
				if (this._rListeners[channel][message].domain === domain) {
					return true;
				}
			}
		}
		return false;
	}

	function addEvent() {
		/*jshint validthis: true */
		var me = this;
		if (this._eventFn) {
			return;
		}
		this._eventFn = function (e) {
			me._onMessage(e);
		};
		if (window.addEventListener) {
			window.addEventListener('message', this._eventFn);
		} else {
			window.attachEvent('onmessage', this._eventFn);
		}
	}

	function removeEvent() {
		/*jshint validthis: true */
		if (!this._eventFn) {
			return;
		}
		if (window.removeEventListener) {
			window.removeEventListener('message', this._eventFn);
		} else {
			window.detachEvent('onmessage', this._eventFn);
		}
		this._eventFn = undefined;
	}

	if(typeof module !== 'undefined' && module.exports) {
		module.exports = PMPlus;
	} else {
		global.PMPlus = PMPlus;
	}
})(this, void 0);
