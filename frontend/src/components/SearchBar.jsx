import React from "react";
import { Search, X } from "lucide-react";

export default function SearchBar({ search, setSearch }) {
  return (
    <div className="relative flex-1 min-w-0">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        aria-label="Search tickets"
        placeholder="Search tickets by ID, customer, email, or description..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 shadow-xs outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
      />
      {search && (
        <button
          onClick={() => setSearch("")}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
          title="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}