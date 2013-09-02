rabbitmq-learnings
==================

Somewhere to keep my RabbitMQ learnings

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

