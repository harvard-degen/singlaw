import { HistoryList } from "@/components/history/HistoryList";

export default function HistoryPage() {
  return (
    <div className="flex-1 flex flex-col p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">
          Research History
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          All your Singapore law queries, newest first.
        </p>
      </div>
      <HistoryList />
    </div>
  );
}
