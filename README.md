postmessage-plus
================

Simple postmessage library. Provides a common API for interacting the window.postMessage and security against listening to dangerous messages.


Generally, window communications take the form of a client/server interaction. The `client` window sends messages to the server. The `server` listens to one or more client's messages.

postmessage-plus supports client-server as well as client-client interactions.

## How to use
Here is a standard setup

#### Server
```js
// Create an instance
var pm = new PMPlus({
  listenDomain: 'http://clientDomain.com' // string, array or regex
});

// Listen to a channel
pm.listen('myChannel', function(data, respond) {
  //... do something async or sync
  
  respond(
    true,  // true for success, false for error
    'Got your message' // Response or Error
  );
});
```

#### Client
```js
// Create an instance
var pm = new PMPlus({
  sendDomain: 'http://serverDomain.com' 
  // only string allowed, default that can be changed on individual messages
});

// Send a message
pm.send({
  w: iframe.contentWindow // window reference
  channel: 'myChannel',
  data: 'Here you go',
  callback: function(success, info) {
    if(success) {
      console.log('Sucess: ', info);
    } else {
      console.log('Error: ', info);
    }
  }
});
```

A single window can be both a server and a client. To send and receive messages, use sendDomain and listenDomain.


