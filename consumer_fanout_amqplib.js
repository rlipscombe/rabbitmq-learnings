var amqp = require('amqplib');

var EXCHANGE_NAME = 'amqplib-fanout-exchange';

amqp.connect().then(function(conn) {
  conn.createChannel().then(function(chan) {
    chan.on('error', console.error);

    var ok = chan.assertExchange(EXCHANGE_NAME, 'fanout', { durable: false });
    ok.then(function(exchange) {
      return chan.assertQueue(null, { autoDelete: true });
    }).then(function(queue) {
      chan.bindQueue(queue.queue, EXCHANGE_NAME, '');
      var ok = chan.consume(queue.queue, function(message) {
        console.log(message);
      });
    });
  });
}).then(null, console.warn);

console.log('Waiting.');
