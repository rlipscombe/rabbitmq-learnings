var amqp = require('amqp');

var EXCHANGE_NAME = process.argv[2];// e.g. 'the-exchange'
if (!EXCHANGE_NAME) { 
  throw new Error("Missing EXCHANGE_NAME argument.");
}

var MESSAGE = process.argv[3];      // e.g. 'Hello'
if (!MESSAGE) { 
  throw new Error("Missing MESSAGE argument.");
}

var connection = amqp.createConnection();
connection.on('error', function(err) { console.error(err); });
connection.on('ready', function() {
  console.log('Connected to AMQP server.');

  connection.exchange(EXCHANGE_NAME, { type: 'fanout' }, function(exchange) {
    console.log('Exchange "' + EXCHANGE_NAME + '" is open.');
    console.log('Publishing message "' + MESSAGE + '".');
    var now = new Date();
    exchange.publish('', { when: now, body: MESSAGE });

    // XXX: Give it time to actually publish the message.
    setTimeout(function() { process.exit(); }, 200);
  });
});
