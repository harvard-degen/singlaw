"""
LLM failover chain:
  1. DeepSeek V3 Chat    (primary  – cheapest quality option)
  2. Qwen 3 8B           (secondary – via OpenRouter)
  3. Groq Llama 3.3 70B  (tertiary – free tier emergency)
"""

import os
import logging
import json
from openai import OpenAI
from prompts import build_system_prompt, build_user_prompt

logger = logging.getLogger(__name__)


def _call_deepseek(question: str, context: str) -> dict:
    client = OpenAI(
        api_key=os.environ["DEEPSEEK_API_KEY"],
        base_url="https://api.deepseek.com",
    )
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": build_system_prompt()},
            {"role": "user", "content": build_user_prompt(question, context)},
        ],
        temperature=0.1,
        max_tokens=2048,
    )
    return {
        "text": response.choices[0].message.content,
        "provider": "deepseek-v3",
        "tokens_used": response.usage.total_tokens if response.usage else 0,
    }


def _call_qwen(question: str, context: str) -> dict:
    client = OpenAI(
        api_key=os.environ["OPENROUTER_API_KEY"],
        base_url="https://openrouter.ai/api/v1",
    )
    response = client.chat.completions.create(
        model="qwen/qwen3-8b",
        messages=[
            {"role": "system", "content": build_system_prompt()},
            {"role": "user", "content": build_user_prompt(question, context)},
        ],
        temperature=0.1,
        max_tokens=2048,
    )
    return {
        "text": response.choices[0].message.content,
        "provider": "qwen3-8b",
        "tokens_used": response.usage.total_tokens if response.usage else 0,
    }


def _call_groq(question: str, context: str) -> dict:
    client = OpenAI(
        api_key=os.environ["GROQ_API_KEY"],
        base_url="https://api.groq.com/openai/v1",
    )
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": build_system_prompt()},
            {"role": "user", "content": build_user_prompt(question, context)},
        ],
        temperature=0.1,
        max_tokens=2048,
    )
    return {
        "text": response.choices[0].message.content,
        "provider": "groq-llama3.3-70b",
        "tokens_used": response.usage.total_tokens if response.usage else 0,
    }


PROVIDERS = [
    ("DeepSeek V3", _call_deepseek),
    ("Qwen 3 8B", _call_qwen),
    ("Groq Llama 3.3", _call_groq),
]


def get_answer(question: str, chunks: list[dict]) -> dict:
    """Try each LLM provider in order. Returns structured response."""
    context = _format_context(chunks)

    last_err = None
    for name, fn in PROVIDERS:
        try:
            logger.info(f"Trying LLM: {name}")
            result = fn(question, context)
            return {
                "answer": result["text"],
                "citations": _extract_citations(chunks),
                "provider": result["provider"],
                "tokens_used": result["tokens_used"],
            }
        except Exception as e:
            logger.warning(f"{name} failed: {e}")
            last_err = e

    raise RuntimeError(f"All LLM providers failed. Last error: {last_err}")


def _format_context(chunks: list[dict]) -> str:
    parts = []
    for i, chunk in enumerate(chunks, 1):
        parts.append(
            f"[{i}] {chunk['source']} – {chunk['section']} (p. {chunk['page']})\n"
            f"{chunk['text']}"
        )
    return "\n\n".join(parts)


def _extract_citations(chunks: list[dict]) -> list[dict]:
    return [
        {
            "source": c["source"],
            "section": c["section"],
            "page": c["page"],
            "snippet": c["text"][:200],
        }
        for c in chunks
    ]
