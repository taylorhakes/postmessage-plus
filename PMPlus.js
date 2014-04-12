(function (global, undefined) {
	/**
	 * Send and Receive message from other windows
	 * @param options {object}
	 * @param options.listenDomain {string|Array} Domain(s) to listen to messages from
	 * @param options.sendDomain {string} Default send domain. Can specify message specific domain in `send` method
	 * @param options.timeout {number} Milliseconds to wait for a response when sending a message
	 * @constructor
	 */
	function PMPlus(options) {
		if (typeof options.listenDomain === 'string') {
			options.listenDomain = [options.listenDomain];
		}
		this._timeout = options.timeout || 3000;
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
				id: generateId(),
				channel: params.channel,
				data: params.data,
				type: 'message'
			}, me = this, domain = params.domain || this._sendD;

		if (!this._sendD && !params.domain) {
			throw new Error('Must specify domain to send message. Default in Constructor or message specific.');
		}
		if (!this._rListeners[params.channel]) {
			this._rListeners[params.channel] = {};
		}

		sendMessage(params.w, info, domain);
		addEvent.call(this);
		if (!this._rListeners[params.channel][info.id] && params.callback) {
			this._rListeners[params.channel][info.id] = {
				timeout: setTimeout(function () {
					params.callback(false, 'Timeout');
					delete me._rListeners[params.channel][info.id]
				}, this._timeout),
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
		if(!this._listenD.length) throw new Error('Not listening to any domains. Specify domains in Constructor.')
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
		var info, response, k, keys, i, responded, onRespond, isListen = checkListenDomain.call(this,
				e.origin), isResponse = checkResponseDomain.call(this, e.origin);

		// Ignore messages from bad domains
		if (!isListen && !isResponse) {
			return;
		}

		try {
			info = JSON.parse(e.data);
		} catch (e) {
			// Some other way of sending data, ignore
			return;
		}

		if (info.type === 'message' && isListen) {
			responded = false;
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
				} catch (e) {
					onRespond(false, 'Unknown Error');
				}
			}
		} else if (info.type === 'response' && this._rListeners[info.channel] && this._rListeners[info.channel][info.id] && this._rListeners[info.channel][info.id].domain === e.origin) {
			clearTimeout(this._rListeners[info.channel][info.id].timeout);
			this._rListeners[info.channel][info.id].callback(info.success, info.data);
			delete this._rListeners[info.channel][info.id]

			keys = false;
			for (k in this._rListeners[info.channel]) {
				keys = true;
				break;
			}
			if (!keys) delete this._rListeners[info.channel]
		}
	};

	function sendMessage(w, info, domain) {
		w.postMessage(JSON.stringify(info), domain);
	}

	function checkListenDomain(domain) {
		for (var i = 0, len = this._listenD.length; i < len; i++) {
			if (domain.match(new RegExp(this._listenD[i]))) {
				return true;
			}
		}
		return false;
	}

	function checkResponseDomain(domain) {
		if (this._sendD === domain) return true;
		for (var channel in this._rListeners) {
			for (var message in this._rListeners[channel]) {
				if (this._rListeners[channel][message] === domain) {
					return true;
				}
			}
		}
		return false
	}

	function addEvent() {
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
			window.attachEvent('onmessage', this._eventFn)
		}
	}

	function removeEvent() {
		if (!this._eventFn) {
			return;
		}
		if (window.removeEventListener) {
			window.removeEventListener('message', this._eventFn);
		} else {
			window.detachEvent('onmessage', this._eventFn)
		}
		this._eventFn = undefined;
	}

	function generateId() {
		var text = "";
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

		for (var i = 0; i < 20; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}

		return text;
	}

	global.PMPlus = PMPlus;
})(this, void 0);