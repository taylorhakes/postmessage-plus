(function(w) {
	describe('PMPlus', function() {
		var event;
		if(window.addEventListener) {
			event = 'addEventListener';
		} else {
			event = 'attachEvent';
		}
		var addEventSpy, postMessageSpy;
		beforeEach(function() {
			addEventSpy = spyOn(w, event);
			postMessageSpy = spyOn(w, 'postMessage');
		});
		describe('send', function() {
			it('Throw error without domain', function() {
				var pm = new PMPlus();

				expect(function() {
					pm.send({
						w: window,
						channel: 'hello',
						data: 'world'
					});
				}).toThrow();

			});
			it('Allow send with domain', function() {
				var pm = new PMPlus();

				expect(function() {
					pm.send({
						w: window,
						channel: 'hello',
						data: 'world',
						domain: 'http://test.com'
					});
				}).not.toThrow();
			});
			it('Check postMessage called', function() {
				var pm = new PMPlus();
				pm.send({
					w: window,
					channel: 'hello',
					data: 'world',
					domain: 'http://test.com'
				});

				expect(w.postMessage).toHaveBeenCalled();
			});
			it('Check postMessage params', function() {
				var pm = new PMPlus(),
					data = 'world',
					channel = 'hello',
					domain = 'http://test.com';

				pm.send({
					w: window,
					channel: channel,
					data: data,
					domain: domain
				});

				var info = JSON.parse(w.postMessage.argsForCall[0][0]),
					resultDomain = w.postMessage.argsForCall[0][1];

				expect(info.id).toBeTruthy();
				expect(info.channel).toBe(channel);
				expect(info.data).toBe(data);
				expect(info.type).toBe('message');
				expect(resultDomain).toBe(domain);
			});
			it('Uses default domain', function() {
				var domain = 'http://tester1234.com',
					pm = new PMPlus({
						sendDomain: domain
					}),
					data = 'world',
					channel = 'hello';

				pm.send({
					w: window,
					channel: channel,
					data: data
				});

				var info = JSON.parse(w.postMessage.argsForCall[0][0]),
					resultDomain = w.postMessage.argsForCall[0][1];

				expect(info.id).toBeTruthy();
				expect(info.channel).toBe(channel);
				expect(info.data).toBe(data);
				expect(info.type).toBe('message');
				expect(resultDomain).toBe(domain);
			});
			it('Overrides default domain', function() {
				var domain = 'http://tester1234.com',
					pm = new PMPlus({
						sendDomain: domain
					}),
					domain2 = 'http://example.com',
					data = 'world',
					channel = 'hello';

				pm.send({
					w: window,
					channel: channel,
					data: data,
					domain: domain2
				});

				var info = JSON.parse(w.postMessage.argsForCall[0][0]),
					resultDomain = w.postMessage.argsForCall[0][1];

				expect(info.id).toBeTruthy();
				expect(info.channel).toBe(channel);
				expect(info.data).toBe(data);
				expect(info.type).toBe('message');
				expect(resultDomain).toBe(domain2);
			});
			it('callback called when everything correct', function() {
				var pm = new PMPlus(),
					domain = 'http://example.com',
					data = 'world',
					channel = 'hello';

				var info = {
					w: window,
					channel: channel,
					data: data,
					domain: domain,
					callback: jasmine.createSpy('callback')
				};
				pm.send(info);

				var result = JSON.parse(w.postMessage.argsForCall[0][0]);

				var fn = addEventSpy.argsForCall[0][1];
				fn({
					origin: domain,
					source: window,
					data: JSON.stringify({
						id: result.id,
						channel: channel,
						success: true,
						data: 'cool',
						type: 'response'
					})
				});

				expect(info.callback).toHaveBeenCalledWith(true, 'cool');
			});
			it('callback called with errors', function() {
				var pm = new PMPlus(),
					domain = 'http://example.com',
					data = 'world',
					channel = 'hello';

				var info = {
					w: window,
					channel: channel,
					data: data,
					domain: domain,
					callback: jasmine.createSpy('callback')
				};
				pm.send(info);

				var result = JSON.parse(w.postMessage.argsForCall[0][0]);

				var fn = addEventSpy.argsForCall[0][1];
				fn({
					origin: domain,
					source: window,
					data: JSON.stringify({
						id: result.id,
						channel: channel,
						success: false,
						data: 'There was an error',
						type: 'response'
					})
				});

				expect(info.callback).toHaveBeenCalledWith(false, 'There was an error');
			});
			it('callback not called if domain wrong', function() {
				var pm = new PMPlus(),
					domain = 'http://example.com',
					data = 'world',
					channel = 'hello';

				var info = {
					w: window,
					channel: channel,
					data: data,
					domain: domain,
					callback: jasmine.createSpy('callback')
				};
				pm.send(info);

				var result = JSON.parse(w.postMessage.argsForCall[0][0]);

				var fn = addEventSpy.argsForCall[0][1];
				fn({
					origin: 'https://example.com',
					source: window,
					data: JSON.stringify({
						id: result.id,
						channel: 'hellos',
						success: true,
						data: 'cool',
						type: 'response'
					})
				});

				expect(info.callback).not.toHaveBeenCalled();
			});
			it('callback not called if response of wrong channel', function() {
				var pm = new PMPlus(),
					domain = 'http://example.com',
					data = 'world',
					channel = 'hello';

				var info = {
					w: window,
					channel: channel,
					data: data,
					domain: domain,
					callback: jasmine.createSpy('callback')
				};
				pm.send(info);

				var result = JSON.parse(w.postMessage.argsForCall[0][0]);

				var fn = addEventSpy.argsForCall[0][1];
				fn({
					origin: domain,
					source: window,
					data: JSON.stringify({
						id: result.id,
						channel: 'hellos',
						success: true,
						data: 'cool',
						type: 'response'
					})
				});

				expect(info.callback).not.toHaveBeenCalled();
			});
			it('callback not called if id is wrong', function() {
				var pm = new PMPlus(),
					domain = 'http://example.com',
					data = 'world',
					channel = 'hello';

				var info = {
					w: window,
					channel: channel,
					data: data,
					domain: domain,
					callback: jasmine.createSpy('callback')
				};
				pm.send(info);

				var fn = addEventSpy.argsForCall[0][1];
				fn({
					origin: domain,
					source: window,
					data: JSON.stringify({
						id: '000',
						channel: channel,
						success: true,
						data: 'cool',
						type: 'response'
					})
				});

				expect(info.callback).not.toHaveBeenCalled();
			});
			it('callback not called if type is not response', function() {
				var pm = new PMPlus(),
					domain = 'http://example.com',
					data = 'world',
					channel = 'hello';

				var info = {
					w: window,
					channel: channel,
					data: data,
					domain: domain,
					callback: jasmine.createSpy('callback')
				};
				pm.send(info);

				var result = JSON.parse(w.postMessage.argsForCall[0][0]);

				var fn = addEventSpy.argsForCall[0][1];
				fn({
					origin: domain,
					source: window,
					data: JSON.stringify({
						id: result.id,
						channel: channel,
						success: true,
						data: 'cool',
						type: 'responses'
					})
				});

				expect(info.callback).not.toHaveBeenCalled();
			});
			it('callback only called once', function() {
				var pm = new PMPlus(),
					domain = 'http://example.com',
					data = 'world',
					channel = 'hello';

				var info = {
					w: window,
					channel: channel,
					data: data,
					domain: domain,
					callback: jasmine.createSpy('callback')
				};
				pm.send(info);

				var result = JSON.parse(w.postMessage.argsForCall[0][0]);

				var fn = addEventSpy.argsForCall[0][1];
				fn({
					origin: domain,
					source: window,
					data: JSON.stringify({
						id: result.id,
						channel: channel,
						success: true,
						data: 'cool',
						type: 'response'
					})
				});
				fn({
					origin: domain,
					source: window,
					data: JSON.stringify({
						id: result.id,
						channel: channel,
						success: true,
						data: 'cool',
						type: 'response'
					})
				});

				expect(info.callback.callCount).toBe(1);
			});
			it('ignored without callback', function() {
				var pm = new PMPlus(),
					domain = 'http://example.com',
					data = 'world',
					channel = 'hello';

				var info = {
					w: window,
					channel: channel,
					data: data,
					domain: domain
				};
				pm.send(info);

				var result = JSON.parse(w.postMessage.argsForCall[0][0]);

				var fn = addEventSpy.argsForCall[0][1];
				fn({
					origin: domain,
					source: window,
					data: JSON.stringify({
						id: result.id,
						channel: channel,
						success: true,
						data: 'cool',
						type: 'response'
					})
				});

				expect(true).toBe(true);
			});
			it('multiple messages same channel', function() {
				var pm = new PMPlus(),
					domain = 'http://example.com',
					channel = 'hello';

				var info1 = {
					w: window,
					channel: channel,
					data: 'message 1',
					domain: domain,
					callback: jasmine.createSpy('callback')
				},
					info2 = {
					w: window,
					channel: channel,
					data: 'message 2',
					domain: domain,
					callback: jasmine.createSpy('callback')
				};

				pm.send(info1);
				pm.send(info2);

				var result1 = JSON.parse(w.postMessage.argsForCall[0][0]),
					fn = addEventSpy.argsForCall[0][1],
					result2 = JSON.parse(w.postMessage.argsForCall[1][0]);
				fn({
					origin: domain,
					source: window,
					data: JSON.stringify({
						id: result2.id,
						channel: channel,
						success: true,
						data: 'response 2',
						type: 'response'
					})
				});
				fn({
					origin: domain,
					source: window,
					data: JSON.stringify({
						id: result1.id,
						channel: channel,
						success: true,
						data: 'response 1',
						type: 'response'
					})
				});

				expect(info1.callback).toHaveBeenCalledWith(true, 'response 1');
				expect(info2.callback).toHaveBeenCalledWith(true, 'response 2');
			});
			it('multiple messages one error', function() {
				var pm = new PMPlus(),
					domain = 'http://example.com',
					channel = 'hello';

				var info1 = {
						w: window,
						channel: channel,
						data: 'message 1',
						domain: domain,
						callback: jasmine.createSpy('callback')
					},
					info2 = {
						w: window,
						channel: channel,
						data: 'message 2',
						domain: domain,
						callback: jasmine.createSpy('callback')
					};

				pm.send(info1);
				pm.send(info2);

				var result1 = JSON.parse(w.postMessage.argsForCall[0][0]),
					fn = addEventSpy.argsForCall[0][1],
					result2 = JSON.parse(w.postMessage.argsForCall[1][0]);
				fn({
					origin: domain,
					source: window,
					data: JSON.stringify({
						id: result2.id,
						channel: channel,
						success: false,
						data: 'response 2',
						type: 'response'
					})
				});
				fn({
					origin: domain,
					source: window,
					data: JSON.stringify({
						id: result1.id,
						channel: channel,
						success: true,
						data: 'response 1',
						type: 'response'
					})
				});

				expect(info1.callback).toHaveBeenCalledWith(true, 'response 1');
				expect(info2.callback).toHaveBeenCalledWith(false, 'response 2');
			});
			it('multiple messages different domain, same ID', function() {
				var pm = new PMPlus(),
					domain = 'http://example.com',
					channel = 'hello';

				var info1 = {
						w: window,
						channel: channel,
						data: 'message 1',
						domain: domain,
						callback: jasmine.createSpy('callback')
					};

				pm.send(info1);

				var result1 = JSON.parse(w.postMessage.argsForCall[0][0]),
					fn = addEventSpy.argsForCall[0][1];
				fn({
					origin: 'http://ex.com',
					source: window,
					data: JSON.stringify({
						id: result1.id,
						channel: channel,
						success: false,
						data: 'response 2',
						type: 'response'
					})
				});
				fn({
					origin: domain,
					source: window,
					data: JSON.stringify({
						id: result1.id,
						channel: channel,
						success: true,
						data: 'response 1',
						type: 'response'
					})
				});

				expect(info1.callback).toHaveBeenCalledWith(true, 'response 1');
			});
			it('multiple messages different channels', function() {
				var pm = new PMPlus(),
					domain = 'http://example.com',
					channel = 'hello';

				var info1 = {
					w: window,
					channel: channel,
					data: 'message 1',
					domain: domain,
					callback: jasmine.createSpy('callback')
				};

				pm.send(info1);

				var result1 = JSON.parse(w.postMessage.argsForCall[0][0]),
					fn = addEventSpy.argsForCall[0][1];
				fn({
					origin: domain,
					source: window,
					data: JSON.stringify({
						id: result1.id,
						channel: 'hell',
						success: false,
						data: 'response 2',
						type: 'response'
					})
				});
				fn({
					origin: domain,
					source: window,
					data: JSON.stringify({
						id: result1.id,
						channel: channel,
						success: true,
						data: 'response 1',
						type: 'response'
					})
				});

				expect(info1.callback).toHaveBeenCalledWith(true, 'response 1');
			});
			it('timeout', function() {
				var info;
				runs(function() {
					var pm = new PMPlus({
							timeout: 50
						}),
						domain = 'http://example.com',
						data = 'world',
						channel = 'hello';

					info = {
						w: window,
						channel: channel,
						data: data,
						domain: domain,
						callback: jasmine.createSpy('callback')
					};
					pm.send(info);
				});
				waitsFor(function() {
					return info.callback.argsForCall[0];
				}, 200);
				runs(function() {
					expect(info.callback).toHaveBeenCalledWith(false, 'Timeout');
				});
			});
		});
		describe('listen', function() {
			it('Throw error without domain', function() {
				var pm = new PMPlus();

				expect(function() {
					pm.listen('fun', function(success, info) {});
				}).toThrow();
			});
			it("No throw with domain", function() {
				var pm = new PMPlus({
					listenDomain: 'http://test.com'
				});

				expect(function() {
					pm.listen('fun', function(success, info) {});
				}).not.toThrow();
			});
			it("Callback called when listening correctly", function() {
				var domain = 'http://test.com',
					pm = new PMPlus({
						listenDomain: domain
					}),
					channel = 'myChannel';

				var listenSpy = jasmine.createSpy('listen');
				pm.listen(channel, listenSpy);

				var fn = addEventSpy.argsForCall[0][1];
				fn({
					origin: domain,
					source: window,
					data: JSON.stringify({
						id: '999',
						channel: channel,
						data: 'cool',
						type: 'message'
					})
				});

				expect(listenSpy.argsForCall[0][0]).toBe('cool');
				expect(typeof listenSpy.argsForCall[0][1]).toBe('function');
			});
			it("Callback called with multiple calls", function() {
				var domain = 'http://test.com',
					pm = new PMPlus({
						listenDomain: domain
					}),
					channel = 'myChannel';

				var listenSpy = jasmine.createSpy('listen');
				pm.listen(channel, listenSpy);

				var fn = addEventSpy.argsForCall[0][1];
				fn({
					origin: domain,
					source: window,
					data: JSON.stringify({
						id: '999',
						channel: channel,
						data: 'cool',
						type: 'message'
					})
				});
				fn({
					origin: domain,
					source: window,
					data: JSON.stringify({
						id: '999',
						channel: channel,
						data: 'coolio',
						type: 'message'
					})
				});

				expect(listenSpy.argsForCall[0][0]).toBe('cool');
				expect(typeof listenSpy.argsForCall[0][1]).toBe('function');
				expect(listenSpy.argsForCall[1][0]).toBe('coolio');
				expect(typeof listenSpy.argsForCall[1][1]).toBe('function');
			});
			it("Callback not called when listening to different channel", function() {
				var domain = 'http://test.com',
					pm = new PMPlus({
						listenDomain: domain
					}),
					channel = 'myChannel';

				var listenSpy = jasmine.createSpy('listen');
				pm.listen(channel, listenSpy);

				var fn = addEventSpy.argsForCall[0][1];
				fn({
					origin: domain,
					source: window,
					data: JSON.stringify({
						id: '999',
						channel: 'another',
						data: 'cool',
						type: 'message'
					})
				});

				expect(listenSpy).not.toHaveBeenCalled();
			});
			it("Callback not called when listening to different domain", function() {
				var domain = 'http://test.com',
					pm = new PMPlus({
						listenDomain: domain
					}),
					channel = 'myChannel';

				var listenSpy = jasmine.createSpy('listen');
				pm.listen(channel, listenSpy);

				var fn = addEventSpy.argsForCall[0][1];
				fn({
					origin: 'https://test.com',
					source: window,
					data: JSON.stringify({
						id: '999',
						channel: channel,
						data: 'cool',
						type: 'message'
					})
				});

				expect(listenSpy).not.toHaveBeenCalled();
			});
			it("Check respond fn calls postMessage correctly", function() {
				var domain = 'http://test.com',
					pm = new PMPlus({
						listenDomain: domain
					}),
					channel = 'myChannel';

				var listenSpy = jasmine.createSpy('listen');
				pm.listen(channel, listenSpy);

				var fn = addEventSpy.argsForCall[0][1];
				var message = {
					id: '999',
					channel: channel,
					data: 'cool',
					type: 'message'
				};

				fn({
					origin: domain,
					source: window,
					data: JSON.stringify(message)
				});

				var respondFn = listenSpy.argsForCall[0][1];

				var respondData = 'beans';
				respondFn(true, respondData);

				var postMessageData = JSON.parse(postMessageSpy.argsForCall[0][0]);

				expect(postMessageData.id).toBe(message.id);
				expect(postMessageData.type).toBe('response');
				expect(postMessageData.channel).toBe(message.channel);
				expect(postMessageData.data).toBe(respondData);
				expect(postMessageData.success).toBe(true);
				expect(postMessageSpy.argsForCall[0][1]).toBe(domain);
			});
			it("Check respond fn calls postMessage with fail", function() {
				var domain = 'http://test.com',
					pm = new PMPlus({
						listenDomain: domain
					}),
					channel = 'myChannel';

				var listenSpy = jasmine.createSpy('listen');
				pm.listen(channel, listenSpy);

				var fn = addEventSpy.argsForCall[0][1];
				var message = {
					id: '999',
					channel: channel,
					data: 'cool',
					type: 'message'
				};

				fn({
					origin: domain,
					source: window,
					data: JSON.stringify(message)
				});

				var respondFn = listenSpy.argsForCall[0][1];

				var respondData = 'beans';
				respondFn(false, respondData);

				var postMessageData = JSON.parse(postMessageSpy.argsForCall[0][0]);

				expect(postMessageData.id).toBe(message.id);
				expect(postMessageData.type).toBe('response');
				expect(postMessageData.channel).toBe(message.channel);
				expect(postMessageData.data).toBe(respondData);
				expect(postMessageData.success).toBe(false);
				expect(postMessageSpy.argsForCall[0][1]).toBe(domain);
			});
			it("Check regex outside Array", function() {
				var domain = new RegExp('http://test.com'),
					pm = new PMPlus({
						listenDomain: domain
					}),
					channel = 'myChannel';

				var listenSpy = jasmine.createSpy('listen');
				pm.listen(channel, listenSpy);

				var fn = addEventSpy.argsForCall[0][1];
				var message = {
					id: '999',
					channel: channel,
					data: 'cool',
					type: 'message'
				};

				fn({
					origin: 'http://test.com',
					source: window,
					data: JSON.stringify(message)
				});

				var respondFn = listenSpy.argsForCall[0][1];

				var respondData = 'beans';
				respondFn(false, respondData);

				var postMessageData = JSON.parse(postMessageSpy.argsForCall[0][0]);

				expect(postMessageData.id).toBe(message.id);
				expect(postMessageData.type).toBe('response');
				expect(postMessageData.channel).toBe(message.channel);
				expect(postMessageData.data).toBe(respondData);
				expect(postMessageData.success).toBe(false);
				expect(postMessageSpy.argsForCall[0][1]).toBe('http://test.com');
			});
		});
	});

})(window);
