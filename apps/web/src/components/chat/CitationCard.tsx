"use client";

type Citation = {
  source: string;
  section: string;
  page: number;
  snippet: string;
};

export function CitationCard({ citation, index }: { citation: Citation; index: number }) {
  return (
    <div className="border border-slate-200 rounded-lg p-3 text-sm">
      <div className="flex items-center gap-2 mb-1">
        <span className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold shrink-0">
          {index + 1}
        </span>
        <span className="font-medium text-slate-700 truncate">{citation.source}</span>
        {citation.page > 0 && (
          <span className="text-slate-400 text-xs ml-auto shrink-0">p. {citation.page}</span>
        )}
      </div>
      {citation.section && (
        <p className="text-slate-500 text-xs mb-1 ml-7">{citation.section}</p>
      )}
      <p className="text-slate-600 text-xs leading-relaxed line-clamp-3 ml-7">{citation.snippet}</p>
    </div>
  );
}
