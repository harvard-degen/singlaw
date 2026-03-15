import pytest
from unittest.mock import MagicMock, patch


def _make_doc(source="Employment Act", page=5, text="Some legal text."):
    doc = MagicMock()
    doc.page_content = text
    doc.metadata = {"source": source, "page": page, "section": "Part II"}
    return doc


def test_retrieve_chunks_returns_correct_shape():
    mock_store = MagicMock()
    mock_store.similarity_search_with_score.return_value = [
        (_make_doc(), 0.20),
        (_make_doc(source="CPF Act", page=3, text="CPF rates."), 0.55),
    ]
    with patch("retriever._vectorstore", mock_store), patch("retriever._load"):
        from retriever import retrieve_chunks
        chunks = retrieve_chunks("What are CPF rates?", top_k=2)

    assert len(chunks) == 2
    assert chunks[0]["source"] == "Employment Act"
    assert "confidence" in chunks[0]
    assert chunks[0]["confidence"] > chunks[1]["confidence"]


def test_retrieve_chunks_confidence_formula():
    """confidence = 1 / (1 + score); perfect match → 1.0"""
    mock_store = MagicMock()
    mock_store.similarity_search_with_score.return_value = [
        (_make_doc(), 0.0),
    ]
    with patch("retriever._vectorstore", mock_store), patch("retriever._load"):
        from retriever import retrieve_chunks
        chunks = retrieve_chunks("test")

    assert chunks[0]["confidence"] == pytest.approx(1.0)


def test_retrieve_chunks_empty_results():
    mock_store = MagicMock()
    mock_store.similarity_search_with_score.return_value = []
    with patch("retriever._vectorstore", mock_store), patch("retriever._load"):
        from retriever import retrieve_chunks
        chunks = retrieve_chunks("irrelevant")
    assert chunks == []
