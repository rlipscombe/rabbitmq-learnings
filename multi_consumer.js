var amqp = require('amqp');

var EXCHANGE_NAME = process.argv[2];  // e.g. direct-exchange
if (!EXCHANGE_NAME) {
  throw new Error("Missing EXCHANGE_NAME argument.");
}

var ROUTING_KEY = process.argv[3];    // e.g. '#'
if (!ROUTING_KEY) {
  throw new Error("Missing ROUTING_KEY argument.");
}

var GROUP_COUNT = 100;
var CONSUMERS_PER_GROUP = 1000;

function start_consumer(connection, g, i) {
  var queue_name = 'multi-' + g + '-' + i;
  connection.queue(queue_name, function(q) {
    console.log('Connected to queue "' + queue_name + '".');
          
    q.bind(EXCHANGE_NAME, ROUTING_KEY);
    console.log('Subscribed with routing key "' + ROUTING_KEY + '".');
                                                                
    q.subscribe(function(message) {
      var now = new Date();
      console.log('Message "' + message.body + 
        '" sent at ' + new Date(message.when).toISOString() + 
        ', received at ' + now.toISOString() + 
        '; ' + (now - new Date(message.when)) + 'ms.');
    });
  });
}

function connection_error(err) {
  console.error(err);
}

function connection_ready(connection, g) {
  return function() {
    console.log('Connected to AMQP server.');

    connection.exchange(EXCHANGE_NAME, { type: 'direct' }, function(exchange) {
      console.log('Exchange "' + EXCHANGE_NAME + '" is open.');
    
      for (var i = 0; i < CONSUMERS_PER_GROUP; ++i) {
        start_consumer(connection, g, i);
      }
    });
  };
}

for (var g = 0; g < GROUP_COUNT; ++g) {
  var connection = amqp.createConnection();
  connection.on('error', connection_error);

  connection.on('ready', connection_ready(connection, g));
}

