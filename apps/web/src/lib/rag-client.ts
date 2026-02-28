export interface Citation {
  source: string;
  section: string;
  page: number;
  snippet: string;
}

export interface RagResponse {
  answer: string;
  citations: Citation[];
  provider: string;
  latency_ms: number;
  tokens_used: number;
}

export async function askRag(question: string): Promise<RagResponse> {
  const ragUrl = process.env.RAG_SERVICE_URL;
  const ragApiKey = process.env.RAG_API_KEY;

  if (!ragUrl || !ragApiKey) {
    throw new Error("RAG service not configured");
  }

  const res = await fetch(`${ragUrl}/api/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": ragApiKey,
    },
    body: JSON.stringify({ question }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`RAG service error ${res.status}: ${text}`);
  }

  return res.json() as Promise<RagResponse>;
}
