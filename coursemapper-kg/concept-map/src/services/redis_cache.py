import redis
from config import Config
from services.cache import Cache

class RedisCache(Cache):
    def __init__(self):
        self.cache = redis.Redis(host=Config.REDIS_HOST, port=Config.REDIS_PORT, db=Config.REDIS_DB, password=Config.REDIS_PASSWORD, decode_responses=True)

    def get(self, key: str):
        return self.cache.get(key)

    def set(self, key: str, value: str) -> bool | None:
        return self.cache.set(key, value)

    def hset(self, key: str, field: str, value: str) -> int:
        return self.cache.hset(key, field, value)

    def hget(self, key: str, field: str) -> str | None:
        return self.cache.hget(key, field)

    def delete(self, key: str) -> int:
        return self.cache.delete(key)

    def flush(self) -> bool:
        return self.cache.flushall()
