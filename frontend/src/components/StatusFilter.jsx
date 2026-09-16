import React from "react";

export default function StatusFilter({ status, setStatus, stats }) {
  const options = [
    { value: "", label: "All Tickets", count: stats?.total },
    { value: "Open", label: "Open", count: stats?.open },
    { value: "In Progress", label: "In Progress", count: stats?.in_progress },
    { value: "Closed", label: "Closed", count: stats?.closed },
  ];

  return (
    <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-slate-100 p-1 shadow-xs">
      {options.map((opt) => {
        const isSelected = status === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStatus(opt.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
              isSelected
                ? "bg-white text-blue-700 shadow-xs border border-slate-200 font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                  isSelected
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-slate-200/80 text-slate-600"
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}