var amqp = require('amqp');

var ROUTING_KEY = process.argv[2];  // e.g. 'simple-queue'; 
var MESSAGE = process.argv[3];      // e.g. 'Hello';

var connection = amqp.createConnection();
connection.on('error', function(err) { console.error(err); });
connection.on('ready', function() {
  console.log('Connected to AMQP server.');

  connection.publish(ROUTING_KEY, MESSAGE);
});
