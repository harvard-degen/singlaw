"""
SingLaw AI – RAG Service
Flask backend: FAISS search + LLM answer generation with failover.

Environment variables required:
  RAG_API_KEY          – shared secret for Next.js -> Flask auth
  DEEPSEEK_API_KEY     – primary LLM (DeepSeek V3)
  OPENROUTER_API_KEY   – secondary LLM (Qwen 3 8B via OpenRouter)
  GROQ_API_KEY         – tertiary LLM (Llama 3.3 70B)
  FAISS_INDEX_PATH     – path to FAISS index file
  EMBEDDINGS_MODEL     – BGE-M3 model path or HF repo id
"""

import os
import time
import logging
from functools import wraps
from flask import Flask, request, jsonify
from llm_providers import get_answer
from retriever import retrieve_chunks

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

RAG_API_KEY = os.environ.get("RAG_API_KEY", "")


def require_api_key(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        key = request.headers.get("X-API-Key", "")
        if not RAG_API_KEY or key != RAG_API_KEY:
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/api/ask", methods=["POST"])
@require_api_key
def ask():
    data = request.get_json(silent=True)
    if not data or "question" not in data:
        return jsonify({"error": "Missing 'question' field"}), 400

    question = str(data["question"]).strip()
    if not question:
        return jsonify({"error": "Empty question"}), 400
    if len(question) > 2000:
        return jsonify({"error": "Question too long (max 2000 chars)"}), 400

    start = time.time()

    try:
        chunks = retrieve_chunks(question, top_k=5)
    except Exception as e:
        logger.exception("Retrieval failed")
        return jsonify({"error": f"Retrieval error: {str(e)}"}), 500

    try:
        result = get_answer(question, chunks)
    except Exception as e:
        logger.exception("LLM generation failed")
        return jsonify({"error": f"LLM error: {str(e)}"}), 500

    latency_ms = int((time.time() - start) * 1000)
    result["latency_ms"] = latency_ms

    return jsonify(result)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=False)
