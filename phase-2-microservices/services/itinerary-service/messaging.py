"""
services/itinerary-service/messaging.py

RabbitMQ Event Producer for publishing asynchronous domain events.
"""
import os
import json
import logging
import pika

logger = logging.getLogger(__name__)

RABBITMQ_HOST = os.environ.get("RABBITMQ_HOST", "rabbitmq")
RABBITMQ_PORT = int(os.environ.get("RABBITMQ_PORT", 5672))
RABBITMQ_QUEUE = "itinerary_events"


def publish_itinerary_created_event(itinerary_data: dict) -> bool:
    """Publish an 'itinerary_created' event to RabbitMQ queue."""
    try:
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(
                host=RABBITMQ_HOST,
                port=RABBITMQ_PORT,
                connection_attempts=3,
                retry_delay=2
            )
        )
        channel = connection.channel()
        channel.queue_declare(queue=RABBITMQ_QUEUE, durable=True)

        event_payload = {
            "event": "itinerary_created",
            "data": itinerary_data
        }

        channel.basic_publish(
            exchange="",
            routing_key=RABBITMQ_QUEUE,
            body=json.dumps(event_payload),
            properties=pika.BasicProperties(
                delivery_mode=2  # Make message persistent
            )
        )
        connection.close()
        logger.info(f"Published 'itinerary_created' event for itinerary ID '{itinerary_data.get('id')}' to RabbitMQ.")
        return True
    except Exception as e:
        logger.warning(f"Could not publish event to RabbitMQ ({e}). Service continuing without blocking.")
        return False
