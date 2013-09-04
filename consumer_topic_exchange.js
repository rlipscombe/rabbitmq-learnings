var amqp = require('amqp');

var QUEUE_NAME = process.argv[2]; // e.g. 'simple-queue'
if (!QUEUE_NAME) { 
  throw new Error("Missing QUEUE_NAME argument.");
}

var EXCHANGE_NAME = process.argv[3];  // e.g. direct-exchange
if (!EXCHANGE_NAME) {
  throw new Error("Missing EXCHANGE_NAME argument.");
}

var ROUTING_KEY = process.argv[4];    // e.g. '#'
if (!ROUTING_KEY) {
  throw new Error("Missing ROUTING_KEY argument.");
}

var connection = amqp.createConnection();
connection.on('error', function(err) { console.error(err); });

connection.on('ready', function() {
  console.log('Connected to AMQP server.');

  connection.exchange(EXCHANGE_NAME, { type: 'topic' }, function(exchange) {
    console.log('Exchange "' + EXCHANGE_NAME + '" is open.');

    connection.queue(QUEUE_NAME, function(q) {
      console.log('Connected to queue "' + QUEUE_NAME + '".');

      q.bind(EXCHANGE_NAME, ROUTING_KEY);
      console.log('Subscribed with routing key "' + ROUTING_KEY + '".');

      q.subscribe(function(message) {
        console.log(message);
      });
    });
  });
});
