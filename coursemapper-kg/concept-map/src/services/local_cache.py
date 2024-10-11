from services.cache import Cache

class LocalCache(Cache):
    def __init__(self):
        self.cache = {}

    def get(self, key: str) -> str | None:
        return self.cache.get(key)

    def set(self, key: str, value: str) -> bool | None:
        self.cache[key] = value
        return True

    def hset(self, key: str, field: str, value: str) -> int:
        if key not in self.cache:
            self.cache[key] = {}
        self.cache[key][field] = value
        return 1

    def hget(self, key: str, field: str) -> str | None:
        return self.cache.get(key, {}).get(field)

    def delete(self, key: str) -> int:
        if key in self.cache:
            del self.cache[key]
            return 1
        return 0

    def flush(self) -> bool:
        self.cache = {}
        return True
