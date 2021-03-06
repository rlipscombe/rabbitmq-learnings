var amqp = require('amqp');

var ROUTING_KEY = process.argv[2];  // e.g. 'simple-queue'
if (!ROUTING_KEY) {
  throw new Error("Missing ROUTING_KEY argument.");
}

var MESSAGE = process.argv[3];      // e.g. 'Hello'
if (!MESSAGE) {
  throw new Error("Missing MESSAGE argument.");
}

var connection = amqp.createConnection();
connection.on('error', function(err) { console.error(err); });
connection.on('ready', function() {
  console.log('Connected to AMQP server.');

  console.log('Publishing "' + MESSAGE + '" with routing key "' + ROUTING_KEY + '".');
  connection.publish(ROUTING_KEY, MESSAGE);

  // XXX: Give it time to actually publish the message.
  setTimeout(function() { process.exit(); }, 100);
});
