import sys
import traceback
from redis import Redis
import json
from threading import Thread
import time
import logging
import io
from log import LOG
import random

from app.views.course_materials import concept_map, get_concepts, get_resources
from config import Config


# For more information about individual redis commands, see:
# https://redis-py.readthedocs.io/en/stable/commands.html


logger = LOG(name=__name__, level=logging.DEBUG)
redis = Redis(host=Config.REDIS_HOST, port=Config.REDIS_PORT, db=Config.REDIS_DB, password=Config.REDIS_PASSWORD)

# Generate a random worker id
random.seed()
worker_id = str(random.randint(0, 1000000))

class LockError(Exception):
    pass

def check_lock(job_id):
    lock = redis.hget(f'locks', job_id)
    assert(type(lock) == bytes)
    lock = lock.decode('utf-8')

    if lock != worker_id:
        # TODO Issue #640: Find a way to stop main thread
        raise LockError()

def status_updater(is_exiting, job_id):
    while not is_exiting[0]:
        # Make sure we still have the lock
        check_lock(job_id)

        # Update the status
        timestamp = str(int(time.time()))
        redis.hset(f'last_updates', job_id, timestamp)

        # Wait a bit
        time.sleep(5)

def start_updater_thread(job_id):
    is_exiting = [False]
    status_thread = Thread(target=status_updater, args=(is_exiting, job_id))
    status_thread.start()
    def stop_thread():
        is_exiting[0] = True
        status_thread.join()
    return stop_thread

def send_result(data):
    # Push result to queue:done
    redis.rpush(f'queue:done', data)

def clean_up(pipeline, job_id):
    # Remove job from queue:processing
    redis.lrem(f'queue:{pipeline}:processing', 0, job_id)

    # Delete status
    redis.hdel(f'last_updates', job_id)

    # Delete lock
    redis.hdel(f'locks', job_id)

    # Delete job
    redis.hdel(f'jobs', job_id)

    # Delete file
    redis.hdel('files', job_id)

def start_worker(pipelines):
    logger.info('Starting worker...')

    # Make sure we are connected to Redis
    if not redis.ping():
        logger.error('Could not connect to Redis')
        sys.exit(1)

    logger.info(f'Worker {worker_id} ready to accept jobs')

    while True:
        # Wait for a hash to be pushed to queue:ready
        queues = [f'queue:{pipeline}:pending' for pipeline in pipelines]
        from_queue, job_id = redis.brpop(queues, 0)
        assert(type(job_id) == bytes and type(from_queue) == bytes)
        pipeline = from_queue.decode('utf-8').split(':')[1]
        job_id = job_id.decode('utf-8')
        redis.lpush(f'queue:{pipeline}:processing', job_id)

        logger.info(f'Received {pipeline} job for {job_id}...')

        # Get the job arguments
        job = redis.hget(f'jobs', job_id)
        assert(type(job) == bytes)
        job = job.decode('utf-8')
        job = json.loads(job)

        # Lock the job
        redis.hset(f'locks', job_id, worker_id)

        # Spawn a thread to send status updates
        stop_thread = start_updater_thread(job_id)

        logger.info(f'Processing {pipeline} job {job_id}...')

        try:
            # Run the pipeline
            if pipeline == 'concept-map':
                file = redis.hget('files', job_id)
                assert(type(file) == bytes)
                file = io.BytesIO(file)
                result = concept_map(job, file)
            elif pipeline == 'concept-recommendation':
                result = get_concepts(job)
            elif pipeline == 'resource-recommendation':
                result = get_resources(job)
            else:
                raise ValueError(f'Unknown pipeline: {pipeline}')

            # Make sure we still have the lock
            check_lock(job_id)

            # Clean up
            clean_up(pipeline, job_id)

            # Send the result
            data = json.dumps({
                "job_id": job_id,
                "result": result
            })
            send_result(data)

            # Wait for alive thread to finish
            stop_thread()

            # Print a message
            logger.info(f'Finished processing {pipeline} job {job_id}')
        except LockError:
            # Print the error
            logger.error(f'Lost lock for job {job_id}')

            # Wait for alive thread to finish
            # TODO what happens if thread is already stopped?
            stop_thread()

            # No need to clean up, another worker will do it
        except KeyboardInterrupt:
            # Quit
            sys.exit()
        except Exception as e:
            # Send the error
            data = json.dumps({
                "job_id": job_id,
                "error": str(e)
            })
            send_result(data)

            # Print a message
            logger.info(f'Error processing {pipeline} job {job_id}')

            # Print the error
            logger.error(traceback.format_exc())

            # Wait for alive thread to finish
            stop_thread()

            # Clean up
            clean_up(pipeline, job_id)

if __name__ == '__main__':
    # Get the pipelines
    pipelines = Config.PIPELINES

    if pipelines is None or pipelines == '':
        logger.error('No pipelines specified')
        sys.exit(1)

    pipelines = pipelines.split(',')

    # Start the worker
    start_worker(pipelines)
