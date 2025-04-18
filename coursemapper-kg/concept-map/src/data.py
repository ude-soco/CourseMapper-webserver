import re
from typing import List, Callable
from numpy import ndarray
from typing import Optional

def clean_id(id: str) -> str:
    return re.sub(r'[^a-zA-Z0-9_]', '_', id)

class Node:
    def __init__(self, id: str, name: str, uri: str, type: str, weight: float, wikipedia: str, text: str, is_draft: bool, isNew: bool, isEditing:bool, lastEdited: bool, embedding: ndarray | None = None, keyphrases: List[str] = [], embedding_model: str | None = None):
        self.id = clean_id(id)
        self.name = name
        self.uri = uri
        self.type = type # material, Slide, main_concept, related_concept, category
        self.weight = weight
        self.wikipedia = wikipedia
        self.text = text
        self.is_draft = is_draft
        self.isNew = isNew	
        self.isEditing = isEditing
        self.lastEdited = lastEdited
        self.embedding = embedding
        self.keyphrases = keyphrases
        self.embedding_model = embedding_model 
        

    @staticmethod
    def from_dict(data: dict):
        return Node(
            data['uid'],
            data['name'],
            data['uri'],
            data['type'],
            data['weight'],
            data['wikipedia'],
            data['abstract'] if data['abstract'] else data['text'],
            data['is_draft'],
            data['isNew'],
            data['isEditing'],
            data['lastEdited'],
            data['embedding'],
            data['keyphrases'],
            data['embedding_model'],
            
        )

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "uri": self.uri,
            "type": self.type,
            "weight": self.weight,
            "wikipedia": self.wikipedia,
            "abstract": self.text,
            "is_draft": self.is_draft,
            "isNew": self.isNew,
            "lastEdited": self.lastEdited,
            "isEditing": self.isEditing,
            "keyphrases": self.keyphrases,
        }

class Edge:
    def __init__(self, source: str, target: str, type: str, weight: float | None = None, disambiguated_weight: float | None = None):
        self.source = source
        self.target = target
        self.type = type # CONTAINS, CONSISTS_OF, RELATED_TO, HAS_CATEGORY
        self.weight = weight
        self.disambiguated_weight = disambiguated_weight

    @staticmethod
    def from_dict(data: dict):
        return Edge(
            data['source'],
            data['target'],
            data['type'],
            data['weight'],
        )

    def serialize(self):
        return {
            "source": self.source,
            "target": self.target,
            "type": self.type,
            "weight": self.weight,
        }

class Graph:
    def __init__(self):
        self.nodes: List[Node] = []
        self.edges: List[Edge] = []

    def add_node(self, node: Node):
        # Check if node already exists
        for existing_node in self.nodes:
            if existing_node.id == node.id:
                return
        # Add node
        self.nodes.append(node)

    def update_node(self, node: Node, func: Callable[[Node], Node]):
        for existing_node in self.nodes:
            if existing_node.id == node.id:
                self.nodes.remove(existing_node)
                self.nodes.append(func(existing_node))
                return

    def add_edge(self, edge: Edge):
        # Check if edge already exists
        for existing_edge in self.edges:
            # if existing_edge.source == edge.source and existing_edge.target == edge.target and existing_edge.type == edge.type and existing_edge.weight == edge.weight and existing_edge.disambiguated_weight == edge.disambiguated_weight:
            if existing_edge.source == edge.source and existing_edge.target == edge.target and existing_edge.type == edge.type:
                return
        # Add edge
        self.edges.append(edge)

    def prune(self):
        # Remove nodes that are not connected to any edge
        self.nodes = [node for node in self.nodes if any(edge.source == node.id or edge.target == node.id for edge in self.edges)]
        # Remove edges that are not connected to any node
        self.edges = [edge for edge in self.edges if any(node.id == edge.source or node.id == edge.target for node in self.nodes)]

    def serialize(self):
        return {
            "nodes": [{"data": node.serialize()} for node in self.nodes],
            "edges": [{"data": edge.serialize()} for edge in self.edges],
        }

    def __getitem__(self, key):
        key = clean_id(key)
        for node in self.nodes:
            if node.id == key:
                return node
        return None
