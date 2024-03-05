import logging
import sys
import json
from logging import Logger, Handler, getLevelName
from logging.handlers import TimedRotatingFileHandler

from app.shared import redis, worker_id, current_job


class LOG(Logger):
    def __init__(
            self,
            log_file=None,
            log_format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            *args,
            **kwargs):
        self.formatter = logging.Formatter(log_format)
        self.log_file = log_file

        Logger.__init__(self, *args, **kwargs)

        self.addHandler(self.get_console_handler())
        if log_file:
            self.addHandler(self.get_file_handler())
        self.addHandler(self.get_redis_handler())
        self.propagate = False

    def get_console_handler(self):
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(self.formatter)
        return console_handler

    def get_file_handler(self):
        file_handler = TimedRotatingFileHandler(self.log_file, when="midnight")
        file_handler.setFormatter(self.formatter)
        return file_handler

    def get_redis_handler(self):
        redis_handler = RedisHandler(worker_id, redis)
        redis_handler.setFormatter(self.formatter)
        return redis_handler


class RedisHandler(Handler):
    def __init__(self, worker_id, redis):
        Handler.__init__(self)
        self.worker_id = worker_id
        self.redis = redis

    def emit(self, record):
        try:
            msg = json.dumps({
                "worker_id": self.worker_id,
                "job_id": current_job["id"],
                "timestamp": record.created,
                "name": record.name,
                "level": record.levelname,
                "message": record.msg
            })
            redis.rpush('log', msg)
        except RecursionError:  # See issue 36272
            raise
        except Exception:
            self.handleError(record)
