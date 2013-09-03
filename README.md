rabbitmq-learnings
==================

Somewhere to keep my RabbitMQ learnings.

## RabbitMQ has a cool visualiser included

If you're experimenting with RabbitMQ, do yourself a favour and install
the visualiser:

    rabbitmq-plugins enable rabbitmq_management_visualiser

Then, when you go to the management web interface, there's a visualiser tab
at http://localhost:15672/visualiser/

You can mouse-over things and see how everything's connected.

## A note: Command lines

Where I've put:

> run `foo bar`

...what I actually mean is:

> run `node foo.js bar`

You'll figure it out.

## `simple_producer` and `simple_consumer`

`simple_consumer` declares a queue, and subscribes to it. Because the
defaults are used, this means that it is bound to the default exchange.
Because the default exchange is a *direct* exchange, this means that
only messages addressed to that queue will be seen.

`simple_producer` publishes a message to the default exchange, using a
routing key that matches the one in `simple_consumer`.

If you run just `simple_consumer my-queue`, you can see in the RabbitMQ visualiser
that there's a queue named "my-queue", connected to the default exchange with
binding "my-queue", with a single listener.

### Queues are autoDelete, by default

Because `simple_consumer` didn't specify any queue options, we got an
`autoDelete: true` queue.

This means that it will be deleted when the last consumer exits.

You can see this by pressing Ctrl+C to kill `simple_consumer`. Note that
the queue is removed from the visualiser.

### Multiple consumers, single queue

If you run `simple_consumer my-queue` twice, you can see in the RabbitMQ
visualiser that there's still a single "my-queue" queue, but that it has
two processes listening to it.

If you send a message to this queue (actually, you're sending a message to
the default exchange with this queue name as the routing key), then one (and
only one) of the consumers will receive the message.

If you send another message to this queue, then the other consumer will
receive the message.

This shows RabbitMQ using a round-robin mechanism to distribute messages to
the queue consumers.

### Multiple consumers, multiple queues

If you run `simple_consumer queue1` and `simple_consumer queue2`, then
you'll end up with both queues attached to the default exchange, each with
one listener.

If you run `simple_producer queue1`, then the message will be delivered
to only one listener. To send to the other listener, specify the other
queue name.

## `simple_consumer_exclusive`

This sample demonstrates the `exclusive: true` option. It calls:

    connection.queue(QUEUE_NAME, { exclusive: true }, /* ... */ );

If you attempt to run it twice, you'll notice that only one consumer is
allowed to connect to the queue at a time.

### Exchange type: direct

If you don't specify an exchange type, *node-amqp* defaults to "topic".
For the next bit, we'll stick with "direct", which is what we've been using
with the default exchange:

    var exchangeIsOpen = function(exchange) { /* ... */ };
    connection.exchange(EXCHANGE_NAME, { type: 'direct' }, exchangeIsOpen);

### Caveat

Unlike some node modules, the *amqp* module doesn't correctly handle a
missing options object when calling `connection.exchange`:

    connection.exchange(EXCHANGE_NAME);

...works, but you didn't pass a callback, so there's a race condition.

This:

    connection.exchange(EXCHANGE_NAME, function(exchange) { /* ... */ });

...doesn't work, because there's no default applied for the options object.
You need to do this instead:

    connection.exchange(EXCHANGE_NAME, {}, function(exchange) { /* ... */ });

## `simple_consumer_exchange`

This sample demonstrates associating a queue with a "direct" exchange.

If you run it as:

    simple_consumer_exchange the-queue the-exchange

and then look in the visualiser, you'll see that there's a new exchange named
"the-exchange".

You'll also see that the queue "the-queue" is bound to two exchanges:
- the default exchange, using the routing filter "the-queue"
- the new exchange, using the routing filter "#".

### It's still bound to the default exchange

You can see that our new consumer still receives messages from the default
exchange by using the old producer to publish a message:

    simple_producer the-queue some-message

This message is still seen by the new consumer.

### Sending to the given exchange

Because we bound the queue to the exchange with the wildcard routing
filter '#', you might expect that any message to the given exchange
will be delivered to the queue.

Wrong. We chose a "direct"-type exchange earlier, which means that the
routing filter must match the routing key.

This means that you have to send messages with routing key '#' for them
to be delivered to that queue.

Try it:

    simple_producer_exchange the-queue the-exchange 'Hello'

Nothing happens, because the queue isn't bound to the exchange using
that routing filter. You need to use the following:

    simple_producer_exchange '#' the-exchange 'Hello'

This works.

### Exchange lifetime: autoDelete

Make sure that you've got no consumers or producers running. If you
look in the visualiser, you'll see that the exchange is still there.

This is because the default options include `autoDelete: false`. This
means that the exchange will **not** be deleted when there are no longer
queues bound to it.

Try the `simple_consumer_exchange_autodelete` example. When it's running,
the exchange exists. When you stop it (press Ctrl+C), the exchange is
deleted.

You can see the exchange options in the visualiser: if you mouse-over the
exchange, the options are displayed at the top of the visualiser tab.

### Exchange lifetime: durable

Also note that the exchange is declared as `durable: false`. This means
that it will not be recreated when the server is restarted.

Try that:

    sudo /etc/init.d/rabbitmq-server restart

Refresh the visualiser. Note that the exchanges you created earlier are
no longer there.

### Direct exchange, different routing keys

What happens if you use a "direct" exchange, with different routing filters?

That is:

    simple_consumer_exchange_routing queue-a the-exchange key-1
    simple_consumer_exchange_routing queue-b the-exchange key-2

If you look in the visualiser, you'll see:
- (as usual) the queues are both connected to the default exchange, with the
  queue name as the routing key.
- the queues are both connected to the "the-exchange" exchange, with different
  routing keys.

You can then send a message to a specific recipient by:

    simple_producer_exchange key-1 the-exchange 'Hello'

If you play around with it some more, you'll see that it's basically just the
same as the default exchange (which is also "direct"), but with different routing
keys.

### Direct exchange, multiple consumers, separate queues, same routing keys

For example:

    simple_consumer_exchange_routing queue-a the-exchange key-1
    simple_consumer_exchange_routing queue-b the-exchange key-1

This one's interesting. Because we've subscribed different queues to the
same key, we end up with the message being delivered to both queues, and
to both consumers.

TODO: How is this different from fanout exchanges?

### Direct exchange, multiple consumers, same queue, same key

For example:

    simple_consumer_exchange_routing queue-a the-exchange key-1
    simple_consumer_exchange_routing queue-a the-exchange key-1

In this example, we have two consumers connected to the same queue,
bound to the same exchange, with the same routing key.

If you publish messages to this:

    simple_producer_exchange key-1 the-exchange 'Hello'

...then the messages are delivered in a round-robin fashion.

### Direct exchange, multiple consumers, same queue, different key

For example:

    simple_consumer_exchange_routing queue-a the-exchange key-1
    simple_consumer_exchange_routing queue-a the-exchange key-2

If you look in the visualiser, you'll see that the two consumers
are listening to the same queue, and the queue is bound to **both**
routing keys.

This means that if you publish a message to the exchange with either
key:

    simple_producer_exchange key-1 the-exchange 'Hello'

...or:

    simple_producer_exchange key-2 the-exchange 'Hello'

...then both consumers will see those messages, delivered in a round-robin
fashion.

This might be surprising:

**If another consumer listens on "your" queue and binds it to the exchange
with a different routing key, then you start to receive some of "his" messages,
and he'll start to start to receive some of "your" messages.**

You might consider opening the queue in exclusive mode.

### TODO: Multiple direct exchanges, multiple consumers, same queue, same key

TODO: Can I connect the same queue to two different exchanges? Why might I want to?

### TODO: Multiple direct exchanges, multiple consumers, same queue, different keys

### It's (not) the same as the default exchange

Apart from the separate queues, same keys case, this is almost the same as the default exchange.
No it's not.

TODO: Describe why
TODO: Can we use a defined routing key with the default exchange? It doesn't appear so.

### TODO: Topic exchange, wildcard routing key, single consumer.
### TODO: Topic exchange, wildcard routing key, multiple consumers.
### TODO: Topic exchange, multiple routing keys, multiple consumers.
### TODO: Topic exchange, bind same queue with multiple routing keys.
### TODO: Fanout exchange

