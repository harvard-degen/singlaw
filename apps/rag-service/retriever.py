"""
FAISS retrieval using BGE-M3 embeddings.
TODO (Day 5): Fork ExploreSingapore and wire real index here.
"""

import os
import logging

logger = logging.getLogger(__name__)

# Lazy-loaded globals
_index = None
_model = None
_metadata = None


def _load():
    global _index, _model, _metadata
    if _index is not None:
        return

    import faiss
    import json
    from sentence_transformers import SentenceTransformer

    index_path = os.environ.get("FAISS_INDEX_PATH", "faiss_index/index.faiss")
    meta_path = os.environ.get("FAISS_META_PATH", "faiss_index/metadata.json")
    model_name = os.environ.get(
        "EMBEDDINGS_MODEL", "BAAI/bge-m3"
    )

    logger.info(f"Loading FAISS index from {index_path}")
    _index = faiss.read_index(index_path)

    logger.info(f"Loading metadata from {meta_path}")
    with open(meta_path) as f:
        _metadata = json.load(f)

    logger.info(f"Loading embeddings model {model_name}")
    _model = SentenceTransformer(model_name)
    logger.info("Retriever ready")


def retrieve_chunks(question: str, top_k: int = 5) -> list[dict]:
    """Return top_k chunks most relevant to the question."""
    _load()

    import numpy as np

    query_vec = _model.encode([question], normalize_embeddings=True)
    query_vec = np.array(query_vec, dtype="float32")

    distances, indices = _index.search(query_vec, top_k)

    chunks = []
    for dist, idx in zip(distances[0], indices[0]):
        if idx == -1:
            continue
        meta = _metadata[idx]
        chunks.append(
            {
                "source": meta.get("source", "Unknown"),
                "section": meta.get("section", ""),
                "page": meta.get("page", 0),
                "text": meta.get("text", ""),
                "score": float(dist),
            }
        )

    return chunks
