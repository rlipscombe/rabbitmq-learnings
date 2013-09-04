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

## `producer` and `consumer`

`consumer` declares a queue, and subscribes to it. Because the
defaults are used, this means that it is bound to the default exchange.
Because the default exchange is a *direct* exchange, this means that
only messages addressed to that queue will be seen.

`producer` publishes a message to the default exchange, using a
routing key that matches the one in `consumer`.

If you run just `consumer my-queue`, you can see in the RabbitMQ visualiser
that there's a queue named "my-queue", connected to the default exchange with
binding "my-queue", with a single listener.

### Queues are autoDelete, by default

Because `consumer` didn't specify any queue options, we got an
`autoDelete: true` queue.

This means that it will be deleted when the last consumer exits.

You can see this by pressing Ctrl+C to kill `consumer`. Note that
the queue is removed from the visualiser.

### Multiple consumers, single queue

If you run `consumer my-queue` twice, you can see in the RabbitMQ
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

If you run `consumer queue1` and `consumer queue2`, then
you'll end up with both queues attached to the default exchange, each with
one listener.

If you run `producer queue1`, then the message will be delivered
to only one listener. To send to the other listener, specify the other
queue name.

## `consumer_exclusive`

This sample demonstrates the `exclusive: true` option. It calls:

    connection.queue(QUEUE_NAME, { exclusive: true }, /* ... */ );

If you attempt to run it twice, you'll notice that only one consumer is
allowed to connect to the queue at a time.

## Exchange type: direct

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

### `consumer_direct_exchange`

This sample demonstrates associating a queue with a "direct" exchange.

If you run it as:

    consumer_direct_exchange the-queue the-exchange

and then look in the visualiser, you'll see that there's a new exchange named
"the-exchange".

You'll also see that the queue "the-queue" is bound to two exchanges:
- the default exchange, using the routing filter "the-queue"
- the new exchange, using the routing filter "#".

TODO: Is this stuff about '#' confusing at this point? Maybe mention it
as an aside?

### It's still bound to the default exchange

You can see that our new consumer still receives messages from the default
exchange by using the old producer to publish a message:

    producer the-queue some-message

This message is still seen by the new consumer.

### Sending to the given exchange

Because we bound the queue to the exchange with the wildcard routing
filter '#', you might expect (if you've been reading about topic exchanges)
that any message to the given exchange will be delivered to the queue.

Wrong. We chose a "direct"-type exchange earlier, which means that the
routing filter must match the routing key.

This means that you have to send messages with routing key '#' for them
to be delivered to that queue.

Try it:

    producer_direct_exchange the-queue the-exchange 'Hello'

Nothing happens, because the queue isn't bound to the exchange using
that routing filter. You need to use the following:

    producer_direct_exchange '#' the-exchange 'Hello'

This works.

### Exchange lifetime: autoDelete

Make sure that you've got no consumers or producers running. If you
look in the visualiser, you'll see that the exchange is still there.

This is because the default options include `autoDelete: false`. This
means that the exchange will **not** be deleted when there are no longer
queues bound to it.

Try the `consumer_direct_exchange_autodelete` example. When it's running,
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

    consumer_direct_exchange_routing queue-a the-exchange key-1
    consumer_direct_exchange_routing queue-b the-exchange key-2

If you look in the visualiser, you'll see:
- (as usual) the queues are both connected to the default exchange, with the
  queue name as the routing key.
- the queues are both connected to the "the-exchange" exchange, with different
  routing keys.

You can then send a message to a specific recipient by:

    producer_direct_exchange key-1 the-exchange 'Hello'

If you play around with it some more, you'll see that it's basically just the
same as the default exchange (which is also "direct"), but with different routing
keys.

### Direct exchange, multiple consumers, separate queues, same routing keys

For example:

    consumer_direct_exchange_routing queue-a the-exchange key-1
    consumer_direct_exchange_routing queue-b the-exchange key-1

This one's interesting. Because we've subscribed different queues to the
same key, we end up with the message being delivered to both queues, and
to both consumers.

TODO: How is this different from fanout exchanges?

### Direct exchange, multiple consumers, same queue, same key

For example:

    consumer_direct_exchange_routing queue-a the-exchange key-1
    consumer_direct_exchange_routing queue-a the-exchange key-1

In this example, we have two consumers connected to the same queue,
bound to the same exchange, with the same routing key.

If you publish messages to this:

    producer_direct_exchange key-1 the-exchange 'Hello'

...then the messages are delivered in a round-robin fashion.

### Direct exchange, multiple consumers, same queue, different key

For example:

    consumer_direct_exchange_routing queue-a the-exchange key-1
    consumer_direct_exchange_routing queue-a the-exchange key-2

If you look in the visualiser, you'll see that the two consumers
are listening to the same queue, and the queue is bound to **both**
routing keys.

This means that if you publish a message to the exchange with either
key:

    producer_direct_exchange key-1 the-exchange 'Hello'

...or:

    producer_direct_exchange key-2 the-exchange 'Hello'

...then both consumers will see those messages, delivered in a round-robin
fashion.

This might be surprising:

**If another consumer listens on "your" queue and binds it to the exchange
with a different routing key, then you start to receive some of "his" messages,
and he'll start to start to receive some of "your" messages.**

You might consider opening the queue in exclusive mode.

### Multiple direct exchanges, multiple consumers, same queue, same key

    consumer_direct_exchange_routing queue-a exchange-x key-1
    consumer_direct_exchange_routing queue-a exchange-y key-1

If you look in the visualiser, you'll see that there are two processes listening
to a single queue, and that this queue is bound to the two exchanges, using the
same key.

This means that, whichever exchange a message is published to, if the key matches,
it'll be delivered to the specified queue, and the two consumers will pick up the
messages in a round-robin fashion.

### Multiple direct exchanges, multiple consumers, same queue, different keys

    consumer_direct_exchange_routing queue-a exchange-x key-1
    consumer_direct_exchange_routing queue-a exchange-y key-2

If you look in the visualiser, you'll see that there are two processes listening
to the same queue, and that the queue is bound to the two exchanges, using different
keys.

This means that, if you publish 'key-2' to 'exchange-x', it won't be delivered,
because that exchange doesn't want to use that queue.

If you publish 'key-1' to 'exchange-x' (or 'key-2' to 'exchange-y'), it'll be
delivered, round-robin, to both, even though they've subscribed with different keys,
because they're listening to the same queue.

### Multiple direct exchanges, multiple consumers, different queues, same key

    consumer_direct_exchange_routing queue-a exchange-x key-1
    consumer_direct_exchange_routing queue-b exchange-y key-1

Because these are different queues, bound to different exchanges (albeit with
the same key), you have to publish 'key-1' to 'exchange-x' to reach the first
consumer, and 'key-1' to 'exchange-y' to reach the second consumer.

There's no overlap.

### Multiple direct exchanges, multiple consumers, different queues, different key

    consumer_direct_exchange_routing queue-a exchange-x key-1
    consumer_direct_exchange_routing queue-b exchange-y key-2

This one's easy -- it's the same as the above. Because they're listening on different
queues, and those queues are bound to different exchanges, there's no overlap.

TODO: Can we use a defined routing key with the default exchange? It doesn't appear so.

## Topic Exchanges

RabbitMQ also supports topic exchanges. To set one of these up, you declare
the exchange with `{ type: 'topic' }`. Then, when you bind the queue to the
exchange, you can specify a routing key with (optionally) wildcards:

    consumer_topic_exchange queue-a topic-exchange '#'

If you look in the visualiser, you'll see a single process listening on 'queue-a',
which is bound, using routing key '#', to the exchange named 'topic-exchange'.

It's also (as usual) bound to the default exchange.

We can publish messages to that exchange:

    producer_topic_exchange 'foo' topic-exchange 'Hello'

This message is picked up by the listener. 

### Topic filters

Topics are expected to be "written.like.this", where each dot separates a subtopic.

In the example above, '#' is a wildcard. It stands for zero or more topics.
- A single '#' matches any topic.
- 'foo.#' matches 'foo', 'foo.bar' and 'foo.bar.baz'.
- 'foo.#.baz' matches 'foo.baz', 'foo.x.baz' and 'foo.x.y.baz',
  but (in particular) not 'foo' or 'baz'.

There's also '\*', which matches exactly one topic.
- A single '\*' matches any single-part topic. So it matches 'foo' or 'bar' or 'baz', but not 'foo.bar' or 'foo.baz'.
- 'foo.\*' matches 'foo.bar' and 'foo.baz', but not 'foo' or 'foo.bar.baz'.
- 'foo.\*.baz' matches 'foo.bar.baz' and 'foo.quux.baz', but not 'foo.baz'.

A note about single dots:
- 'foo.' is a two-part topic, where the second part is empty. This means that '#' will match it, but '\*' won't.
- Similarly, 'foo..baz' is a three part topic.

TODO: Some worked examples.

### Some examples with multiple consumers

If you bind two consumers to the same queue with the same topic,
it'll deliver matching messages to the queue, where they'll be delivered round-robin.

    consumer_topic_exchange queue-a 'foo.#' topic-exchange
    consumer_topic_exchange queue-a 'foo.#' topic-exchange

If two consumers bind two separate queues with the same topic, you'll get a copy to each:

    cte A 'foo.#' topic-exchange
    cte B 'foo.#' topic-exchange

If two consumers bind different queues with overlapping topics, one will get a subset:

    cte A 'foo.#' topic-exchange
    cte B 'foo.bar.#' topic-exchange

Similarly, if two consumers bind the same queue with different topics,
then you'll get (round-robin) crosstalk:

    cte A 'foo.#' topic-exchange
    cte A 'bar.#' topic-exchange

Two consumers, same queue, overlapping topics => crosstalk

    cte A 'foo.#' topic-exchange
    cte A 'foo.bar.#' topic-exchange

### A note about not killing consumers (Caveat)

If you have a non-exclusive, non-autoDelete queue, and you leave a consumer
connected, with (e.g.) routing key 'foo.#', and then you start another consumer,
with (e.g.) routing key 'bar.#', and then you kill the first consumer:

The queue will still be bound to the exchange using both routing keys, which means
that the second consumer will see 'foo.whatever' messages.

### TODO: Fanout exchange

Let's assume we wanted to broadcast a message to many consumers.

We could use:
- a single direct exchange.
- multiple queues with the same routing keys.
- multiple consumers, one per queue.

...or, we could use:
- a single topic exchange.
- multiple queues with the same (or overlapping) routing keys.
- multiple consumers, one per queue.

Or there's fanout exchanges. What are they for?
