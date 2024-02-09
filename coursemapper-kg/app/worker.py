import sys
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


logger = LOG(name=__name__, level=logging.DEBUG)
client = Redis(host=Config.REDIS_HOST, port=Config.REDIS_PORT, db=Config.REDIS_DB, password=Config.REDIS_PASSWORD)

# Generate a random worker id
random.seed()
worker_id = str(random.randint(0, 1000000))

class LockError(Exception):
    pass

def check_lock(job_id):
    lock = client.hget(f'locks', job_id)
    assert(type(lock) == bytes)
    lock = lock.decode('utf-8')

    if lock != worker_id:
        raise LockError()

def status_updater(is_exiting, job_id):
    while not is_exiting[0]:
        # Make sure we still have the lock
        check_lock(job_id)

        # Update the status
        timestamp = str(int(time.time()))
        client.hset(f'last_updates', job_id, timestamp)

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
    client.rpush(f'queue:done', data)

def clean_up(pipeline, job_id, material_id):
    # Remove job from queue:processing
    client.lrem(f'queue:{pipeline}:processing', 0, job_id)

    # Delete status
    client.hdel(f'last_updates', job_id)

    # Delete lock
    client.hdel(f'locks', job_id)

    # Delete job
    client.hdel(f'jobs', job_id)

    # Delete file
    if pipeline == 'concept-map':
        client.hdel('files', material_id)

def start_worker(pipelines):
    logger.info('Starting worker...')

    while True:
        # Wait for a hash to be pushed to queue:ready
        queues = [f'queue:{pipeline}:pending' for pipeline in pipelines]
        from_queue, job_id = client.brpop(queues, 0)
        assert(type(job_id) == bytes and type(from_queue) == bytes)
        pipeline = from_queue.decode('utf-8').split(':')[1]
        job_id = job_id.decode('utf-8')
        client.lpush(f'queue:{pipeline}:processing', job_id)

        logger.info(f'Received {pipeline} job for {job_id}...')

        # Get the job arguments
        job = client.hget(f'jobs', job_id)
        assert(type(job) == bytes)
        job = job.decode('utf-8')
        job = json.loads(job)

        # Lock the job
        client.hset(f'locks', job_id, worker_id)

        # Spawn a thread to send status updates
        stop_thread = start_updater_thread(job_id)

        logger.info(f'Processing {pipeline} job {job_id}...')

        try:
            # Run the pipeline
            if pipeline == 'concept-map':
                file = client.hget('files', job.get('materialId'))
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

            # Send the result
            data = json.dumps({
                "job_id": job_id,
                "result": result
            })
            send_result(data)

            # Clean up
            clean_up(pipeline, job_id, job.get('materialId'))

            # Print a message
            logger.info(f'Finished processing {pipeline} job {job_id}')
        except LockError:
            # Print the error
            logger.error(f'Lost lock for job {job_id}')

            # No need to clean up, another worker will do it
        except Exception as e:
            # Send the error
            data = json.dumps({
                "job_id": job_id,
                "error": str(e)
            })
            send_result(data)

            # Print the error
            logger.error(e)

            # Clean up
            clean_up(pipeline, job_id, job.get('materialId'))

        # Wait for alive thread to finish
        stop_thread()

if __name__ == '__main__':
    # Get the pipelines
    pipelines = Config.PIPELINES

    if pipelines is None or pipelines == '':
        logger.error('No pipelines specified')
        sys.exit(1)

    pipelines = pipelines.split(',')

    # Start the worker
    start_worker(pipelines)
