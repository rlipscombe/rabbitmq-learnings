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

### Multiple consumers

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

