# TODOS

## rag-service

### Refactor `llm_providers.py` — eliminate provider function duplication

**What:** Replace `_call_deepseek`, `_call_qwen`, `_call_groq` with a single generic
`_call_provider(api_key, base_url, model, question, context)` driven by a config list.

**Why:** Three functions share 95% identical code (same OpenAI client pattern, same message
structure, same return shape). Any change to retry logic, timeout, or token handling must
be made in 3 places today.

**Where to start:** `apps/rag-service/llm_providers.py` lines 17–77.

**Pros:**
- One place to add retry/backoff, request timeouts, or token budget logic
- Adding a 4th provider becomes a one-line config entry, not a new function

**Cons:** Tiny increase in indirection (config list vs named functions)

**Depends on:** Nothing. Safe to do in isolation.
