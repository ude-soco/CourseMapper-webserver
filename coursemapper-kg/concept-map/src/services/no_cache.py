from services.cache import Cache

class NoCache(Cache):
    def get(self, key: str) -> str | None:
        return None

    def set(self, key: str, value: str) -> bool | None:
        return None

    def hset(self, key: str, field: str, value: str) -> int:
        return 0

    def hget(self, key: str, field: str) -> str | None:
        return None

    def delete(self, key: str) -> int:
        return 0

    def flush(self) -> bool:
        return True
