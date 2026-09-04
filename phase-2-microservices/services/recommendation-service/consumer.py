"""
services/recommendation-service/consumer.py

RabbitMQ Event Consumer listening for asynchronous events (e.g. 'itinerary_created').
"""
import os
import time
import json
import logging
import threading
import pika

logger = logging.getLogger(__name__)

RABBITMQ_HOST = os.environ.get("RABBITMQ_HOST", "rabbitmq")
RABBITMQ_PORT = int(os.environ.get("RABBITMQ_PORT", 5672))
RABBITMQ_QUEUE = "itinerary_events"

# In-memory recommendation metrics / event log cache
EVENT_LOG = []


def on_message_received(ch, method, properties, body):
    try:
        data = json.loads(body)
        event_name = data.get("event")
        payload = data.get("data", {})
        
        logger.info(f"Received event '{event_name}' via RabbitMQ: {payload}")
        EVENT_LOG.append({
            "timestamp": time.time(),
            "event": event_name,
            "payload": payload
        })
        
        # Acknowledge message
        ch.basic_ack(delivery_tag=method.delivery_tag)
    except Exception as e:
        logger.error(f"Error processing RabbitMQ message: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)


def start_rabbitmq_consumer():
    """Run RabbitMQ consumer connection loop in background thread with reconnect logic."""
    def run():
        while True:
            try:
                logger.info(f"Connecting RabbitMQ consumer to {RABBITMQ_HOST}:{RABBITMQ_PORT}...")
                connection = pika.BlockingConnection(
                    pika.ConnectionParameters(
                        host=RABBITMQ_HOST,
                        port=RABBITMQ_PORT,
                        connection_attempts=5,
                        retry_delay=5
                    )
                )
                channel = connection.channel()
                channel.queue_declare(queue=RABBITMQ_QUEUE, durable=True)
                channel.basic_qos(prefetch_count=1)
                channel.basic_consume(queue=RABBITMQ_QUEUE, on_message_callback=on_message_received)
                
                logger.info("RabbitMQ Consumer successfully connected and listening for events...")
                channel.start_consuming()
            except Exception as e:
                logger.warning(f"RabbitMQ consumer disconnected/failed: {e}. Retrying in 10 seconds...")
                time.sleep(10)

    thread = threading.Thread(target=run, daemon=True)
    thread.start()
