from config import Config
from pipelines.concept_map import ConceptMapPipeline
from pipelines.modify_graph import ModifyGraphPipeline
from pipelines.expand_material import ExpandMaterialPipeline

from cm_worker import Worker


# Create the worker
worker = Worker(Config.REDIS_HOST, Config.REDIS_PORT, Config.REDIS_DB, Config.REDIS_PASSWORD)
worker.log_to_console = True


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
        return {}
    worker.add_pipeline('expand-material', execute_expand_material_job)


if __name__ == '__main__':
    # Start the worker
    worker.start()
