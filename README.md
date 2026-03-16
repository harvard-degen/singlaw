# Singlaw.ai

> AI-powered legal research for Singapore law — accurate, private, and built to replace the associate grind.

Singlaw is a RAG (Retrieval-Augmented Generation) intelligence engine purpose-built for Singaporean laws, policies, and legal history. It combines semantic search over a curated legal corpus with a triple-LLM failover backend, delivered through a clean subscription web app.

---

## Why Singlaw

Singapore law firms spend significant budget on junior associates doing repetitive legal research. Generic AI tools like ChatGPT lack the domain accuracy and client-data privacy guarantees that legal work demands.

Singlaw is designed to pass a **Legal Turing Test** — producing research-quality output with full reasoning trails that a qualified lawyer can audit, correct, and rely on. The goal is not to assist lawyers; it is to replace the research associate role entirely.

**Key differentiators:**
- Singapore-specific legal corpus (statutes, case law, policies)
- On-premise / private-cloud deployment options for client confidentiality
- Hallucination guardrails built into the retrieval and generation pipeline
- Audit trail: every answer cites the exact source chunks it was drawn from

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  apps/web  (Next.js 15)              │
│  Clerk auth · tRPC · Stripe billing · Prisma ORM    │
└─────────────────────┬───────────────────────────────┘
                      │  HTTP  (X-API-Key)
┌─────────────────────▼───────────────────────────────┐
│              apps/rag-service  (Flask)               │
│                                                      │
│  POST /api/ask                                       │
│    │                                                 │
│    ├─ retriever.py  →  FAISS + BGE-M3 embeddings    │
│    │                   top-k semantic chunks         │
│    │                                                 │
│    └─ llm_providers.py  →  failover chain           │
│         1. DeepSeek V3      (primary)               │
│         2. Qwen 3 8B        (via OpenRouter)        │
│         3. Llama 3.3 70B   (via Groq)               │
└─────────────────────────────────────────────────────┘
```

### Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, Tailwind CSS v4, TypeScript |
| API layer | tRPC v11, Zod, SuperJSON |
| Auth | Clerk |
| Payments | Stripe |
| Database | Prisma ORM |
| Analytics | PostHog |
| RAG backend | Flask, FAISS, `sentence-transformers` (BGE-M3) |
| LLMs | DeepSeek V3 → Qwen 3 8B → Llama 3.3 70B (failover) |
| Infra | Docker, Gunicorn |
| CI | GitHub Actions, pre-commit |

---

## Project Structure

```
singlaw/
├── apps/
│   ├── web/                  # Next.js frontend + tRPC API
│   │   ├── src/
│   │   ├── prisma/
│   │   └── Dockerfile
│   └── rag-service/          # Python RAG backend
│       ├── app.py            # Flask app, /api/ask endpoint
│       ├── retriever.py      # FAISS semantic search
│       ├── llm_providers.py  # Triple-LLM failover
│       ├── build_index.py    # Index PDFs into FAISS
│       ├── prompts.py        # LLM prompt templates
│       └── tests/
└── docs/
```

---

## Getting Started

### Prerequisites

- Node.js 20+, npm
- Python 3.11+
- A FAISS index built from your legal PDF corpus (see below)

### 1. RAG service

```bash
cd apps/rag-service
pip install -r requirements.txt

# Build the FAISS index from PDFs
python build_index.py --pdf-dir ./data/pdfs --index-out ./data/faiss.index

# Copy and fill in env vars
cp .env.example .env

# Run
python app.py
```

Required environment variables (`.env`):

```
RAG_API_KEY=<shared secret for Next.js → Flask auth>
DEEPSEEK_API_KEY=<DeepSeek V3 key>
OPENROUTER_API_KEY=<OpenRouter key for Qwen>
GROQ_API_KEY=<Groq key for Llama>
FAISS_INDEX_PATH=./data/faiss.index
EMBEDDINGS_MODEL=BAAI/bge-m3
```

### 2. Web app

```bash
cd apps/web
npm install
cp .env.example .env.local   # fill in Clerk, Stripe, DB, RAG_API_KEY
npm run dev
```

---

## Quality & Accuracy

Legal AI carries professional liability risk. Inaccurate output can expose both users and operators to harm. This shapes every engineering decision:

- **Hybrid retrieval** — semantic FAISS search combined with re-ranking; future support for Elasticsearch BM25 hybrid mode
- **Source citations** — every answer returns the exact chunks used so lawyers can verify
- **Hallucination auditing** — output reviewed by a linguistics/NLP expert before production deployment
- **Guardrails** — prompt-level and post-processing checks flag low-confidence answers

---

## Roadmap

- [ ] Hybrid BM25 + FAISS retrieval
- [ ] Re-ranking layer (cross-encoder)
- [ ] On-premise deployment guide
- [ ] Per-query confidence scoring
- [ ] Lawyer feedback loop for fine-tuning
- [ ] Multi-jurisdiction support

---

## License

Private — Singlaw Pte. Ltd. All rights reserved.
