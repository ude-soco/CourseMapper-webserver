import pandas as pd

import logging
from log import LOG
import wikipedia
from wikipedia import PageError
from wikipedia import DisambiguationError

logger = LOG(name=__name__, level=logging.DEBUG)


class WikipediaService:
    def get_articles(self, concepts, top_n=15):
        """ """

        logger.info("Get Wikipedia Articles")

        response = wikipedia.search(concepts, top_n)

        data = []
        w_data = []

        for title in response:
            try:
                page = wikipedia.page(title) # auto_suggest=False
                # content = page.content
                abstract = page.summary
                url = page.url
                # thumbnail_url = page.images[0] if len(page.images) > 0 else ""
                # logger.info("Title: %s"%title)
                # logger.info("Thumbnail_url: %s"%thumbnail_url)
                # data.append([url, content, abstract, title, thumbnail_url])
                # data.append([url, content, abstract, title, concepts])
                data.append([url, title + ". " + abstract, abstract, title, concepts])
                # print("w_data", data)

            except (PageError, DisambiguationError) as e:
                # logger.error("title {} raised a PageError".format(title), e)
                pass
            finally:
                # w_data = pd.DataFrame(data, columns=["id", "text", "abstract", "title", "thumbnail_url"])
                w_data = pd.DataFrame(
                    data, columns=["id", "text", "abstract", "title", "query"]
                )

        return w_data
