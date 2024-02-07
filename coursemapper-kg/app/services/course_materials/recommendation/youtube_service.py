import time

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api import NoTranscriptFound
from youtube_transcript_api import TranscriptsDisabled
import googleapiclient.discovery
import googleapiclient.errors
import pandas as pd
from socket import *
import os
import re
import logging
from log import LOG
import time

logger = LOG(name=__name__, level=logging.DEBUG)


def get_subtitles(video_id):
    transcripts = YouTubeTranscriptApi.get_transcript(
        video_id, languages=["en", "en-GB"]
    )
    transcripts_text = []
    for t in transcripts:
        text = t["text"]
        transcripts_text.append(text)
    transcripts_text = " ".join(transcripts_text)
    return transcripts_text


class YoutubeService:
    os.environ[
        "GOOGLE_APPLICATION_CREDENTIALS"
    ] = "masterthesis-350015-47ab14d0b53b.json"
    api_service_name = "youtube"
    api_version = "v3"

    # DEVELOPER_KEY = os.environ.get("YOUTUBE_API_KEY")
    DEVELOPER_KEY = "AIzaSyBphZOn7EJmPMmZwrB71aepaA5Rbuex9MU"
    youtube = googleapiclient.discovery.build(
        api_service_name,
        api_version,
        developerKey="AIzaSyClxnNwQ1x34pGioQazLlGxOjO9Fp2GGTY",
    )

    def get_videos(self, concepts, top_n=15):
        logger.info("Get Videos")
        # logger.info(concepts)
        video_data = []
        duration_list = []
        view_list = []
        description_list = []
        retry_count = 3
        retry_delay = 5

        for i in range(retry_count):
            try:
                # your code that makes the YouTube API request
                request = self.youtube.search().list(
                    part="snippet",
                    maxResults=top_n,
                    type="video",
                    q=concepts,
                    relevanceLanguage="en",
                )

                response = request.execute()
                break  # exit the loop if the request succeeds
            except (ConnectionAbortedError, ConnectionResetError, timeout) as e:
                logger.error("Error while getting the videos")
                logger.error(e)
                if i == retry_count - 1:
                    raise  # re-raise the exception if all retries fail
                delay = retry_delay * (
                    2**i
                )  # use a backoff algorithm to increase the delay
                time.sleep(delay)
                logger.info("New Try")

        if len(response["items"]) == 0:
            logger.info("No Video found for this input")
            return []
        else:
            df_items = pd.DataFrame(response["items"])
            df_ids_list = df_items["id"].to_list()
            df_ids = pd.DataFrame(df_ids_list)
            df_ids.rename(columns={"videoId": "id"}, inplace=True)

            df_snippet_list = df_items["snippet"].to_list()
            df_snippet = pd.DataFrame(df_snippet_list)
            # df_snippet["text"] = pd.DataFrame(df_snippet["title"] + ". " + df_snippet["description"])
            # df_snippet["text"] = df_snippet["text"].str.lower()
            # df_snippet["text"] = pd.DataFrame(df_snippet["title"])
            # df_snippet["query"] = concepts
            for index, id in enumerate(df_ids["id"]):
                # try:
                #    df_snippet["text"][index] = df_snippet["text"][index] + ". " + get_subtitles(id)
                # except (NoTranscriptFound, TranscriptsDisabled) as e:
                #    logger.error("No transcript found in english or transcript disabled for this video "
                #                 "https://www.youtube.com/watch?v={} ".format(id))

                try:
                    duration, views, description = self.get_video_details(id)
                    duration = re.findall(r"\d+", duration)
                    duration = ":".join(duration)
                    # print(id, duration, views)
                    duration_list.append(duration)
                    view_list.append(views)
                    description_list.append(description)
                except Exception as e:
                    logger.error("Error while getting the videos details", e)

            video_data = df_ids.join(df_snippet)
            video_data["duration"] = pd.Series(duration_list)
            video_data["views"] = pd.Series(view_list)
            video_data["description_full"] = pd.Series(description_list)
            video_data["text"] = pd.DataFrame(
                video_data["title"] + ". " + video_data["description"]
            )
            video_data["text"] = video_data["text"].str.lower()

            video_data = video_data.fillna("-1")

        return video_data

    def get_video_details(self, video_id):
        # print("get_video_details for id -------------------- ", video_id)
        r = (
            self.youtube.videos()
            .list(
                part="snippet,statistics,contentDetails",
                id=video_id,
                fields="items(statistics," + "contentDetails(duration),snippet)",
            )
            .execute()
        )
        try:
            duration = (
                r["items"][0]["contentDetails"]["duration"]
                if r["items"][0]["contentDetails"]["duration"]
                else 0
            )
            views = (
                r["items"][0]["statistics"]["viewCount"]
                if r["items"][0]["statistics"]["viewCount"]
                else 0
            )
            description = (
                r["items"][0]["snippet"]["description"]
                if r["items"][0]["snippet"]["description"]
                else ""
            )

        except Exception as e:
            print("---------------------------------------")
            print(e)
            # The number of views are not present for some videos and this leads to an exception. For this
            # reason a default value of 0 views will be given that video.
            views = 0
            duration = (
                r["items"][0]["contentDetails"]["duration"]
                if r["items"][0]["contentDetails"]["duration"]
                else 0
            )
            description = (
                r["items"][0]["snippet"]["description"]
                if r["items"][0]["snippet"]["description"]
                else ""
            )

            return duration, views, description
        return duration, views, description
