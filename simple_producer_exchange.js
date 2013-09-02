var amqp = require('amqp');

var ROUTING_KEY = process.argv[2];  // e.g. 'the-queue'
if (!ROUTING_KEY) { 
  throw new Error("Missing ROUTING_KEY argument.");
}

var EXCHANGE_NAME = process.argv[3];// e.g. 'the-exchange'
if (!EXCHANGE_NAME) { 
  throw new Error("Missing EXCHANGE_NAME argument.");
}

var MESSAGE = process.argv[4];      // e.g. 'Hello'
if (!MESSAGE) { 
  throw new Error("Missing MESSAGE argument.");
}

var connection = amqp.createConnection();
connection.on('error', function(err) { console.error(err); });
connection.on('ready', function() {
  console.log('Connected to AMQP server.');

  connection.exchange(EXCHANGE_NAME, { type: 'direct' }, function(exchange) {
    console.log('Exchange is open.');
    console.log('Publishing message.');
    exchange.publish(ROUTING_KEY, MESSAGE);
  });
});
