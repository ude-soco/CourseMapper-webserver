import concurrent.futures
from flask import current_app

from ..db.neo4_db import NeoDataBase

from .recommendation_type import RecommendationType
from .recommender import Recommender


class ResourceRecommenderService:
    def __init__(self):
        neo4j_uri = current_app.config.get("NEO4J_URI")  # type: ignore
        neo4j_user = current_app.config.get("NEO4J_USER")  # type: ignore
        neo4j_pass = current_app.config.get("NEO4J_PASSWORD")  # type: ignore

        self.db = NeoDataBase(neo4j_uri, neo4j_user, neo4j_pass)

    def check_parameters(
        self,
        slide_id,
        material_id,
        non_understood_concept_ids,
        understood_concept_ids,
        new_concept_ids,
        recommendation_type,
    ):
        if not self.db.slide_exists(slide_id):
            return "No Slide found with id: %s" % slide_id

        if not self.db.lm_exists(material_id):
            return "No Learning Material found with id: %s" % slide_id

        # if not self.db.user_exists(user_id):
        #     return 'No User found with id: %s' % slide_id

        if not recommendation_type in ["1", "2", "3", "4"]:
            return "Recommendation type %s not supported" % recommendation_type

        for cid in (
            non_understood_concept_ids + understood_concept_ids + new_concept_ids
        ):
            if not self.db.concept_exists(cid):
                return "No User found with id: %s" % slide_id

        return ""

    def get_top_n_dnu_concepts(self, user, top_n):
        return self.db.get_top_n_dnu_concepts(user=user, top_n=top_n)
        # TODO: material_id is missing and the user argument is not correctly used
        # return self.db.get_top_n_dnu_concepts(user_id=user, material_id=material_id top_n=top_n)

    def get_slide_concepts(self, slide_id):
        return

    def _construct_user(self, user, non_understood, understood, new_concepts, mid):
        self.db.construct_user_model(
            user, non_understood, understood, new_concepts, mid
        )

    def _get_personalized_recommendation(
        self,
        not_understood_concept_list,
        user_embedding,
        resource_type,
        recommendation_type,
    ):
        return self.recommender.recommend(
            not_understood_concept_list=not_understood_concept_list,
            user_embedding=user_embedding,
            video=True if resource_type == "Youtube" else False,
            recommendation_type=recommendation_type,
        )

    def _get_static_recommendation(
        self,
        slide_document_embedding,
        slide_concepts,
        slide_weighted_avg_embedding_of_concepts,
        resource_type,
        recommendation_type,
    ):
        return self.recommender.recommend(
            not_understood_concept_list=slide_concepts,
            slide_document_embedding=slide_document_embedding,
            slide_concepts=slide_concepts,
            slide_weighted_avg_embedding_of_concepts=slide_weighted_avg_embedding_of_concepts,
            video=True if resource_type == "Youtube" else False,
            recommendation_type=recommendation_type,
        )

    def _get_resources(self, user_id, slide_id, material_id, recommendation_type):
        """ """
        wikipedia_articles = []
        youtube_videos = []
        resource_list = []
        relationship_list = []
        not_understood_concept_list = []
        concepts = []
        
        self.recommender = Recommender()

        # Allow parallel recommendation of videos and articles
        with concurrent.futures.ThreadPoolExecutor() as executor:
            futures = {}
            resource_types = ["Youtube", "Wikipedia"]

            # If personalized, get user information from the database then proceed with the personalized recommendation
            if (
                recommendation_type != RecommendationType.WITHOUT_EMBEDDING
                and self.db.user_exists(user_id)
                and recommendation_type != RecommendationType.COMBINED_STATIC
                and recommendation_type != RecommendationType.STATIC_KEYPHRASE_BASED
                and recommendation_type != RecommendationType.STATIC_DOCUMENT_BASED
            ):
                concepts = self.db.get_top_n_dnu_concepts(
                    user_id=user_id, material_id=material_id, top_n=5
                )
                user_embedding = self.db.get_or_create_user(user_id)[0]["u"][
                    "embedding"
                ]
                not_understood_concept_list = [concept["name"] for concept in concepts]
                concept_ids = [concept["cid"] for concept in concepts]

                for resource_type in resource_types:
                    # Start the load operations and mark each future with its URL
                    future = executor.submit(
                        self._get_personalized_recommendation,
                        not_understood_concept_list=not_understood_concept_list,
                        user_embedding=user_embedding,
                        resource_type=resource_type,
                        recommendation_type=recommendation_type,
                    )
                    futures[future] = resource_type
            # Else retrieve Slide information from the database then proceed with the static recommendation
            else:
                _slide = self.db.get_slide(slide_id)
                slide_concepts = _slide[0]["s"]["concepts"]
                # slide_text = _slide[0]["s"]["text"]
                slide_document_embedding = _slide[0]["s"]["initial_embedding"]
                slide_weighted_avg_embedding_of_concepts = _slide[0]["s"][
                    "weighted_embedding_of_concept"
                ]

                for name in slide_concepts:
                    concepts.append(self.db.get_top_n_concept_by_name(name=name)[0])

                concept_ids = [concept["cid"] for concept in concepts]

                for resource_type in resource_types:
                    # Start the load operations and mark each future with the resource type
                    future = executor.submit(
                        self._get_static_recommendation,
                        slide_document_embedding=slide_document_embedding,
                        slide_concepts=concepts,
                        slide_weighted_avg_embedding_of_concepts=slide_weighted_avg_embedding_of_concepts,
                        resource_type=resource_type,
                        recommendation_type=recommendation_type,
                    )
                    futures[future] = resource_type

            # When one of the parallel operations is finish retrieve results
            # 3000s is the maximum time allowed for each operation
            for future in concurrent.futures.as_completed(futures, 3000):
                print("future value")
                print(future)
                data_type = futures[future]
                try:
                    if data_type == "Youtube":
                        youtube_videos = future.result()
                        print(youtube_videos)
                    else:
                        wikipedia_articles = future.result()
                        print(wikipedia_articles)
                except Exception as exc:
                    print("%r generated an exception: %s" % (data_type, exc))

        # for cid in concept_ids:
        #
        #     resources, relationships = self.db.get_concept_resources(cid, user_id)
        #
        #     if not resources:
        #         if self.db.concept_exists(cid):
        #             concept_name = self.db.get_concept_name_by_id(cid)[0]['c']['name']
        #             not_understood_concept_list.append(concept_name)
        #         else:
        #     else:
        #         resource_list.extend([r for r in resources if r not in resource_list])
        #         relationship_list.extend([r for r in relationships if r not in relationship_list])
        #
        # if len(not_understood_concept_list) <= 0 < len(resource_list):
        #
        #     return get_serialized_resource_data(resource_list, relationship_list)

        # If both results are empty return an empty object
        if (isinstance(youtube_videos, list) or youtube_videos.empty) and (
            isinstance(wikipedia_articles, list) or wikipedia_articles.empty
        ):
            return {}

        # Otherwise proceed save the results in the database
        resources, relationships = self.db.get_or_create_resoures_relationships(
            wikipedia_articles=wikipedia_articles,
            youtube_videos=youtube_videos,
            user_id=user_id,
            material_id=material_id,
            concept_ids=concept_ids,
            recommendation_type=recommendation_type,
        )
        result_video_ids = []
        result_article_ids = []

        if not isinstance(youtube_videos, list) and not youtube_videos.empty:
            result_video_ids = youtube_videos["id"].tolist()

        if not isinstance(wikipedia_articles, list) and not wikipedia_articles.empty:
            result_article_ids = wikipedia_articles["id"].tolist()

        result_ids = result_video_ids + result_article_ids

        # filter the results from the database and keep only the ones generated by the Recommender
        filtered_resources = [r for r in resources if r["rid"] in result_ids]

        # if not isinstance(youtube_videos, list) and (not youtube_videos.empty):
        #     youtube_videos = youtube_videos.drop(columns=["concept_embedding", "text", 'thumbnails', 'description',
        #     'description_full', 'id', 'title', 'channelTitle', 'liveBroadcastContent', 'kind', 'publishedAt',
        #     'channelId', 'publishTime', 'views', 'duration'])
        #     # file_path_youtube = "recommendation/data/video_concept_user_description_and_title_only.csv"
        #     file_path_youtube = "recommendation/data/video_concept_subtitles_only_15.csv"
        #     # file_path_youtube = "recommendation/data/video_document_subtitles_only_15.csv"
        #     # file_path_youtube = "recommendation/data/video_document_user.csv"
        #     # file_path_youtube = "recommendation/data/video_document_user_20.csv"
        #     # file_path_youtube = "recommendation/data/video_document_user_15.csv"
        #     # file_path_youtube = "recommendation/data/video_document_user_10.csv"
        #     # file_path_youtube = "recommendation/data/video_concept_user_description_and_title_only_15.csv"
        #     # file_path_youtube = "recommendation/data/video_concept_user_subtitles_only_15.csv"
        #     # file_path_youtube = "recommendation/data/video_concept_user_description_and_title_only_10.csv"
        #
        #     # youtube_videos.to_csv(file_path_youtube, index=False)
        #     youtube_videos.to_csv(file_path_youtube, mode='a', index=False, header=False)
        #
        # if not isinstance(wikipedia_articles, list) and (not wikipedia_articles.empty):
        #     wikipedia_articles = wikipedia_articles.drop(columns=["concept_embedding", "text", 'abstract', 'id',
        #     'title'])
        #     # file_path_wikipedia = "recommendation/data/article_concept_user_abstract_and_title_only.csv"
        #     file_path_wikipedia = "recommendation/data/article_concept_content_only_15.csv"
        #     # file_path_wikipedia = "recommendation/data/article_document_content_only_15.csv"
        #     # file_path_wikipedia = "recommendation/data/article_document_user.csv"
        #     # file_path_wikipedia = "recommendation/data/article_document_user_20.csv"
        #     # file_path_wikipedia = "recommendation/data/article_document_user_15.csv"
        #     # file_path_wikipedia = "recommendation/data/article_document_user_10.csv"
        #     # file_path_wikipedia = "recommendation/data/article_concept_user_abstract_and_title_only_15.csv"
        #     # file_path_wikipedia = "recommendation/data/article_concept_user_content_only_15.csv"
        #     # file_path_wikipedia = "recommendation/data/article_concept_user_abstract_and_title_only_10.csv"
        #
        #     # wikipedia_articles.to_csv(file_path_wikipedia, index=False)
        #     wikipedia_articles.to_csv(file_path_wikipedia, mode='a', index=False, header=False)

        # file_path_youtube = "recommendation/dat2/video_data_all_without_user.png"
        # file_path_wikipedia = "recommendation/dat2/articles_data_all_without_user.png"
        # file_path_youtube_document_based_similarity = "recommendation/data/dist2/video_document_based_similarity.png"
        # file_path_wikipedia_document_based_similarity = "recommendation/data/dist2/articles_document_based_similarity.png"
        # file_path_youtube_concept_based_similarity = "recommendation/data/dist2/video_concept_based_similarity.png"
        # file_path_wikipedia_concept_based_similarity = "recommendation/data/dist2/articles_concept_based_similarity.png"
        # file_path_youtube_user_document_based_similarity = "recommendation/data/dist2/video_user_document_based_similarity.png"
        # file_path_wikipedia_user_document_based_similarity = "recommendation/data/dist2/articles_user_document_based_similarity.png"
        # file_path_youtube_user_concept_based_similarity = "recommendation/data/dist2/video_user_concept_based_similarity.png"
        # file_path_wikipedia_user_concept_based_similarity = "recommendation/data/dist2/articles_user_concept_based_similarity.png"
        # file_path_youtube_fused_similarity = "recommendation/data/dist2/video_fused_similarity.png"
        # file_path_wikipedia_fused_similarity = "recommendation/data/dist2/articles_fused_similarity.png"
        # file_path_youtube_fused_user_similarity = "recommendation/data/dist2/video_fused_user_similarity.png"
        # file_path_wikipedia_fused_user_similarity = "recommendation/data/dist2/articles_fused_user_similarity.png"
        #
        # save_plot_data(youtube_videos, file_path_youtube)
        # save_plot_data(wikipedia_articles, file_path_wikipedia)
        #
        #
        # plot_distribution_chart(youtube_videos, "document_based_similarity", file_path_youtube_document_based_similarity)
        # plot_distribution_chart(wikipedia_articles, "document_based_similarity", file_path_wikipedia_document_based_similarity)
        # plot_distribution_chart(youtube_videos, "concept_based_similarity", file_path_youtube_concept_based_similarity)
        # plot_distribution_chart(wikipedia_articles, "concept_based_similarity", file_path_wikipedia_concept_based_similarity)
        # plot_distribution_chart(youtube_videos, "user_document_based_similarity", file_path_youtube_user_document_based_similarity)
        # plot_distribution_chart(wikipedia_articles, "user_document_based_similarity", file_path_wikipedia_user_document_based_similarity)
        # plot_distribution_chart(youtube_videos, "user_concept_based_similarity", file_path_youtube_user_concept_based_similarity)
        # plot_distribution_chart(wikipedia_articles, "user_concept_based_similarity", file_path_wikipedia_user_concept_based_similarity)
        # plot_distribution_chart(youtube_videos, "fused_similarity", file_path_youtube_fused_similarity)
        # plot_distribution_chart(wikipedia_articles, "fused_similarity", file_path_wikipedia_fused_similarity)
        # plot_distribution_chart(youtube_videos, "fused_user_similarity", file_path_youtube_fused_user_similarity)
        # plot_distribution_chart(wikipedia_articles, "fused_user_similarity", file_path_wikipedia_fused_user_similarity)

        resp = get_serialized_resource_data(filtered_resources, concepts, relations=[])
        return resp


def get_serialized_resource_data(resources, concepts, relations):
    """ """
    data = {}
    ser_resources = []
    ser_realations = []

    for resource in resources:
        r = {
            "title": resource["title"],
            "id": resource["rid"],
            "uri": resource["uri"],
            "helpful_counter": resource["helpful_count"],
            "not_helpful_counter": resource["not_helpful_count"],
            "labels": resource["labels"],
            "similarity_score": resource["similarity_score"],
            "keyphrases": resource["keyphrases"],
        }

        if "Video" in r["labels"]:
            r["description"] = resource["description"]
            r["description_full"] = resource["description_full"]
            r["thumbnail"] = resource["thumbnail"]
            r["duration"] = resource["duration"]
            r["views"] = resource["views"]
            r["publish_time"] = resource["publish_time"]

        elif "Article" in r["labels"]:
            r["abstract"] = resource["abstract"]

        ser_resources.append({"data": r})
    for relation in relations:
        r = {
            "type": relation["type"],
            "source": relation["source"],
            "target": relation["target"],
        }
        ser_realations.append({"data": r})
    data["concepts"] = concepts
    data["nodes"] = ser_resources
    data["edges"] = ser_realations

    return data


def save_data_to_file(data, file_path):
    data.to_csv(file_path, sep="\t", encoding="utf-8")
