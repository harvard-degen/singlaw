"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { CitationCard } from "./CitationCard";

type Citation = { source: string; section: string; page: number; snippet: string };

type ChatResult = {
  id: string;
  answer: string;
  citations: Citation[];
  provider: string;
  latencyMs: number;
};

export function ChatBox({
  queriesUsed,
  queryLimit,
}: {
  queriesUsed: number;
  queryLimit: number;
}) {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<ChatResult | null>(null);

  const ask = trpc.query.ask.useMutation({
    onSuccess: (data: ChatResult) => setResult(data),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = question.trim();
    if (!q || q.length < 10 || ask.isPending) return;
    setResult(null);
    ask.mutate({ question: q });
  };

  const remaining = queryLimit - queriesUsed;

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
      <div className="flex justify-end">
        <span className="text-xs text-slate-400">
          {queriesUsed} / {queryLimit} queries used this month
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a Singapore law question — e.g. 'What are the grounds for wrongful dismissal under the Employment Act?'"
          className="w-full rounded-xl border border-slate-200 p-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-28"
          disabled={ask.isPending || remaining <= 0}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">{question.length}/2000</span>
          <button
            type="submit"
            disabled={ask.isPending || question.trim().length < 10 || remaining <= 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            {ask.isPending ? "Researching..." : "Research"}
          </button>
        </div>
      </form>

      {remaining <= 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          Monthly query limit reached. Resets at the start of next month.
        </div>
      )}

      {ask.isPending && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-6 flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
          <span className="text-sm text-slate-500">
            Searching 33,000+ Singapore legal documents...
          </span>
        </div>
      )}

      {ask.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {ask.error.message.includes("Monthly query limit")
            ? "Monthly query limit reached."
            : "Something went wrong. Please try again."}
        </div>
      )}

      {result && !ask.isPending && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
              {result.answer}
            </p>
            <p className="text-slate-400 text-xs mt-3">
              via {result.provider} · {result.latencyMs}ms
            </p>
          </div>

          {result.citations.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Sources
              </h3>
              {result.citations.map((c, i) => (
                <CitationCard key={i} citation={c} index={i} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
