"""
FAISS retrieval using BGE-M3 + LangChain FAISS format.
Index must be built with build_index.py (produces index.faiss + index.pkl).
"""
import os
import logging

logger = logging.getLogger(__name__)

_vectorstore = None


def _load() -> None:
    global _vectorstore
    if _vectorstore is not None:
        return

    from langchain_community.embeddings import HuggingFaceBgeEmbeddings
    from langchain_community.vectorstores import FAISS

    index_path = os.environ.get("FAISS_INDEX_PATH", "faiss_index_bgem3")
    model_name = os.environ.get("EMBEDDINGS_MODEL", "BAAI/bge-m3")

    logger.info(f"Loading embeddings: {model_name}")
    embeddings = HuggingFaceBgeEmbeddings(
        model_name=model_name,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )

    logger.info(f"Loading FAISS index from: {index_path}")
    _vectorstore = FAISS.load_local(
        index_path, embeddings, allow_dangerous_deserialization=True
    )
    logger.info("Retriever ready")


def retrieve_chunks(question: str, top_k: int = 5) -> list[dict]:
    """Return top_k most relevant chunks with confidence scores."""
    _load()

    results = _vectorstore.similarity_search_with_score(question, k=top_k)
    chunks = []
    for doc, score in results:
        confidence = 1.0 / (1.0 + score)
        chunks.append({
            "source": doc.metadata.get("source", "Unknown"),
            "section": doc.metadata.get("section", ""),
            "page": doc.metadata.get("page", 0),
            "text": doc.page_content,
            "score": float(score),
            "confidence": round(confidence, 4),
        })
    return chunks
