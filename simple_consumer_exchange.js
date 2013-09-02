var amqp = require('amqp');

var QUEUE_NAME = process.argv[2]; // e.g. 'simple-queue'
if (!QUEUE_NAME) { 
  throw new Error("Missing QUEUE_NAME parameter.");
}

var EXCHANGE_NAME = process.argv[3];  // e.g. direct-exchange
if (!EXCHANGE_NAME) {
  throw new Error("Missing EXCHANGE_NAME parameter.");
}

var connection = amqp.createConnection();
connection.on('error', function(err) { console.error(err); });
connection.on('ready', function() {
  console.log('Connected to AMQP server.');

  connection.exchange(EXCHANGE_NAME);

  connection.queue(QUEUE_NAME, function(q) {
    console.log('Connected to queue.');

    q.bind(EXCHANGE_NAME, '#');

    q.subscribe(function(message) { 
      console.log(message);
    });
  });
});
