"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";

type Citation = { source: string; section: string; page: number; snippet: string };
type QueryRecord = {
  id: string;
  question: string;
  answer: string;
  citations: unknown;
  llmProvider: string;
  latencyMs: number;
  createdAt: Date;
};

function HistoryItem({ record }: { record: QueryRecord }) {
  const [expanded, setExpanded] = useState(false);
  const citations = Array.isArray(record.citations)
    ? (record.citations as Citation[])
    : [];

  return (
    <div className="border border-slate-200 rounded-xl p-4 flex flex-col gap-2">
      <button
        className="flex justify-between items-start gap-4 text-left w-full"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">
            {record.question}
          </p>
          <p className="text-xs text-slate-500 truncate">
            {record.answer.slice(0, 120)}...
          </p>
        </div>
        <div className="flex flex-col items-end shrink-0 gap-1">
          <span className="text-xs text-slate-400">
            {new Date(record.createdAt).toLocaleDateString("en-SG", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          {citations.length > 0 && (
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {citations.length} source{citations.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </button>

      {expanded && (
        <div className="mt-2 pt-3 border-t border-slate-100 flex flex-col gap-3">
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {record.answer}
          </p>
          {citations.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Sources
              </p>
              {citations.map((c, i) => (
                <p key={i} className="text-xs text-slate-500">
                  [{i + 1}] {c.source}
                  {c.page > 0 ? ` — p. ${c.page}` : ""}
                </p>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-400">
            via {record.llmProvider} · {record.latencyMs}ms
          </p>
        </div>
      )}
    </div>
  );
}

export function HistoryList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    trpc.query.getHistory.useInfiniteQuery(
      { limit: 20 },
      { getNextPageParam: (last) => last.nextCursor }
    );

  const allQueries = data?.pages.flatMap((p) => p.queries) ?? [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (allQueries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-slate-500 text-sm">No research history yet.</p>
        <p className="text-slate-400 text-xs mt-1">
          Your queries will appear here after your first search.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 max-w-3xl">
      {allQueries.map((q) => (
        <HistoryItem key={q.id} record={q as QueryRecord} />
      ))}
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="text-sm text-blue-600 hover:underline disabled:opacity-50 self-center py-2"
        >
          {isFetchingNextPage ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}
