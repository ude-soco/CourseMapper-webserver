from config import Config
from pipelines.concept_map import ConceptMapPipeline
from pipelines.modify_graph import ModifyGraphPipeline
from pipelines.expand_material import ExpandMaterialPipeline

from cm_worker import Worker
import json
import hashlib


# Create the worker
worker = Worker(Config.REDIS_HOST, Config.REDIS_PORT, Config.REDIS_DB, Config.REDIS_PASSWORD)
worker.log_to_console = True


def create_job_and_set_state(pipeline_name, args_dict, state="pending"):
    redis_client = worker.redis
    args_json = json.dumps(args_dict, sort_keys=True)
    job_id = hashlib.sha256(args_json.encode()).hexdigest()

    # Define the job with pipeline name, args, and state
    job_data = {
        # "id": job_id,
        "pipeline": pipeline_name,
        "data": args_json,
        # "state": state
    }

    job_exists = redis_client.hget('jobs', job_id)
    if job_exists:
        print(f"Job with identifier {job_id} already exists")
    else:
        # Save the job in Redis
        redis_client.hset('jobs', job_id, json.dumps(job_data).encode('utf-8'))
        # redis_client.hset('jobs', job_id, job_data)

        # Push the job ID to the appropriate queue based on the state
        redis_client.lpush(f"queue:{pipeline_name}:pending", job_id)
        print(f"Job {job_id} created with state '{state}', pipeline '{pipeline_name}', and args {args_dict}")


# Concept map pipeline
if 'concept-map' in Config.PIPELINES:
    concept_map_pipeline = ConceptMapPipeline()
    def execute_concept_map_job(job):
        file = worker.get_file(worker.job_id)
        graph = concept_map_pipeline.run(worker.push_log_message, job.get('materialId'), job.get('materialName'), file)
        return graph.serialize()
    worker.add_pipeline('concept-map', execute_concept_map_job)

# Modify graph pipeline
if 'modify-graph' in Config.PIPELINES:
    modify_graph_pipeline = ModifyGraphPipeline()
    def execute_modify_graph_job(job):
        if job.get('action') == 'add-concept':
            modify_graph_pipeline.add_concept(job.get('materialId'), job.get('conceptName'), job.get('slides'))
        elif job.get('action') == 'remove-concept':
            modify_graph_pipeline.remove_concept(job.get('materialId'), job.get('conceptId'))
        return {}
    worker.add_pipeline('modify-graph', execute_modify_graph_job)

# Expand material pipeline
if 'expand-material' in Config.PIPELINES:
    expand_material_pipeline = ExpandMaterialPipeline()
    def execute_expand_material_job(job):
        expand_material_pipeline.run(worker.push_log_message, job.get('materialId'))

        # after publishing, craw resources for main concepts
        # create_job_and_set_state(pipeline_name="get_resources_by_main_concepts", 
        #                          args_dict={"materialId": job.get('materialId')}
        #                         )

        return {}
    worker.add_pipeline('expand-material', execute_expand_material_job)
    

if __name__ == '__main__':
    # Start the worker
    worker.start()
