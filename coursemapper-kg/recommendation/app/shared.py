import random
from redis import Redis
from config import Config

# Connect to redis
# For more information about individual redis commands, see:
# https://redis-py.readthedocs.io/en/stable/commands.html
redis = Redis(host=Config.REDIS_HOST, port=Config.REDIS_PORT, db=Config.REDIS_DB, password=Config.REDIS_PASSWORD)

# Generate a random worker id
random.seed()
worker_id = str(random.randint(0, 1000000))

# Store the current job id
current_job = { "id": None }
def set_current_job_id(job_id):
    global current_job_id
    current_job["id"] = job_id
