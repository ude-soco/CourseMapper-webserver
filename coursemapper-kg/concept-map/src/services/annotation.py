import requests
import json
from threading import Thread
from typing import List, Dict, Any, Tuple
from services.cache import Cache
import socket
from services.wikipedia import WikipediaService
from config import Config


dns_cache = {}
# Capture a dict of hostname and their IPs to override with
def override_dns(domain, ip):
    dns_cache[domain] = ip


prv_getaddrinfo = socket.getaddrinfo
# Override default socket.getaddrinfo() and pass ip instead of host
# if override is detected
def new_getaddrinfo(*args, **kwargs):
    if args[0] in dns_cache:
        return prv_getaddrinfo(dns_cache[args[0]], *args[1:], **kwargs)
    else:
        return prv_getaddrinfo(*args, **kwargs)


socket.getaddrinfo = new_getaddrinfo

override_dns('api.dbpedia-spotlight.org', '134.155.95.34')


def make_parallel_requests(url: str, headers: Dict[str, str], params: List[Any]) -> List[Tuple[dict, requests.Response]]:
    """
    Make parallel requests to a URL.

    Args:
    url (str): The URL to make requests to.
    headers (List[str]): A list of headers to use for each request.
    params (List[Any]): A list of parameters to use for each request.

    Returns:
    List[Tuple[dict, requests.Response]]: A list of param, response tuples.
    """
    responses = []
    threads = []

    def make_request(url: str, headers: Dict[str, str], params: Any):
        response = requests.get(url, headers=headers, params=params)
        responses.append((params, response))

    for param in params:
        thread = Thread(target=make_request, args=(url, headers, param))
        thread.start()
        threads.append(thread)

    for thread in threads:
        thread.join()

    return responses


class AnnotationService:
    def __init__(self, cache: Cache, wikipedia_service: WikipediaService):
        self._cache = cache
        self._wikipedia_service = wikipedia_service

    def get_annotation_from_cache(self, keyphrase: str) -> List[str] | None:
        """
        Get the annotation for a keyphrase from the cache.

        Args:
        keyphrase (str): The keyphrase to get the annotation for.

        Returns:
        List[str]: A list of Wikipedia article titles.
        """
        result = self._cache.hget('annotations', keyphrase)
        if result is None:
            return None
        return json.loads(str(result))

    def set_annotation_in_cache(self, keyphrase: str, annotation: List[str]) -> None:
        """
        Set an annotation for a keyphrase into the cache.

        Args:
        keyphrase (str): The keyphrase to set the annotation for.
        annotation (List[str]): A list of Wikipedia article titles.
        """
        self._cache.hset('annotations', keyphrase, json.dumps(annotation))

    def annotate_keyphrases(self, keyphrases: List[str]) -> List[Tuple[str, str]]:
        """
        Annotate a list of keyphrases using DBpedia Spotlight.

        Args:
        keyphrases (List[str]): A list of keyphrases to annotate.

        Returns:
        List[Tuple[str, str]]: A list of keyphrase, annotation tuples for the keyphrases.
        """
        url = Config.DBPEDIA_SPOTLIGHT_URL  # URL for the English language API

        headers = {
            'Accept': 'application/json'
        }

        params = []

        annotations = []
        for phrase in keyphrases:
            cached_annotation = self.get_annotation_from_cache(phrase)
            if cached_annotation is not None:
                annotations.extend([(phrase, annotation_) for annotation_ in cached_annotation])
                continue

            params.append({
                'text': phrase,
                'confidence': Config.DBPEDIA_SPOTLIGHT_CONFIDENCE,
                'support': Config.DBPEDIA_SPOTLIGHT_SUPPORT
            })

        responses = make_parallel_requests(url, headers, params)

        for response in responses:
            if response[1].status_code == 200:
                res = response[1].json()
                if 'Resources' in res:
                    keyphrase = res['@text']
                    annotation = [resource['@URI'].split("/resource/")[1] for resource in res['Resources']]
                    annotations.extend([(keyphrase, annotation_) for annotation_ in annotation])
                    self.set_annotation_in_cache(keyphrase, annotation)
            else:
                raise Exception(f"Failed to annotate keyphrase: {response[1].status_code}")

        return annotations
