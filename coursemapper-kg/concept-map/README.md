# New KG Pipeline

## Neo4j

```python
data_service._extract_vector_relation(mid=material_id)
gcn = GCN()
gcn.load_data()
```

```python
import numpy as np
import scipy.sparse as sp

from config import Config


class GCN:
    def load_data(self, idx_features, edges):
        # The structure of idx_features: first column is new id of node(type:int), the second column is the original id (type:string), and the rest is the initial embedding

        # Construct initial embedding matrix
        # Extract initial embedding starts from the third column
        features = sp.csr_matrix(idx_features[:, 2:], dtype=np.float32)

        # Construct Adjacency matrix

        # Extract new id of node
        idx = np.array(idx_features[:, 0], dtype=np.float32)
        # Replace id with row number
        # row0: id1 initial_embedding1  -> 0 initial_embedding1
        # row1: id2 initial_embedding2  -> 1 initial_embedding2
        # row2: id3 initial_embedding3  -> 2 initial_embedding3
        idx_map = {j: i for i, j in enumerate(idx)}

        # Replace data in edge1 with row numer for id and weight for weight.
        # id1 0.8 id2 -> 0 0.8 1
        # id2 0.7 id3 -> 1 0.7 2
        # id4 0.6 id5 -> 3 0.6 4
        edges_row = np.array(list(map(idx_map.get, edges[:, 0].flatten())))
        edges_column = np.array(list(map(idx_map.get, edges[:, 2].flatten())))
        # edges_row means number of row, edges_column means number of column, edges[:,1] means value.
        # 0 0.8 1 means the value in the first column of row zero is 0.8. i.e. the relationship weight of id1 and id2 is 0.8
        adj = sp.coo_matrix(
            (edges[:, 1], (edges_row[:], edges_column[:])),
            shape=(features.shape[0], features.shape[0]),
            dtype=np.float32,
        )
        adj = np.around(adj, 2)
        # matrix plus its unit matrix and transpose matrix to obtain the complete adjacency matrix
        adj = adj + adj.T.multiply(adj.T > adj) - adj.multiply(adj.T > adj)

        adj = self.normalize(adj) + sp.eye(adj.shape[0])
        # GCN Multiply Adjacency matrix and initial embedding matrix
        # mutiply Adjacency matrix and initial embedding matrix, output is new embedding matrix
        # The new embedding of a node is obtained by aggregating the embeddings of its first hop neighbours
        output = np.dot(adj, features)
        # mutiply Adjacency matrix and new embedding matrix, output is final embedding matrix
        # The final embedding of a node is obtained by aggregating the embeddings of its first and second hop neighbours
        output = np.dot(adj, output)
        final_embeddings = output.A

        # Extract original ids of nodes
        idx = np.array(idx_features[:, 1], dtype=np.dtype(str))
        with self.driver.session() as session:
            for i in range(final_embeddings.shape[0]):
                id = idx[i]
                f_embedding = final_embeddings[i]
                embedding = ",".join(str(i) for i in f_embedding)
                # Find a node in neo4j by its original id and save its final embedding into its "final_embedding" property
                result = session.run("""MATCH (n) WHERE n.cid= $id or n.sid= $id
                        set n.final_embedding = $embedding RETURN n""",
                    id=id,
                    embedding=embedding)

    def normalize(self, mx):
        rowsum = np.array(mx.sum(1))
        d_inv = np.power(rowsum, -0.5).flatten()
        d_inv[np.isinf(d_inv)] = 0.0
        d_mat_inv = sp.diags(d_inv)
        norm_adj = d_mat_inv.dot(mx)
        norm_adj = norm_adj.dot(d_mat_inv)
        return norm_adj
```
