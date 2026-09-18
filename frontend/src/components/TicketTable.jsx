import React from "react";
import TicketRow from "./TicketRow";
import { Inbox, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function TicketTable({ tickets, loading, error, onResetFilters, onRetry, page = 1, totalTickets, onPageChange, pageSize = 10 }) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-3 animate-pulse">
          <div className="h-8 bg-slate-100 rounded w-full"></div>
          <div className="h-12 bg-slate-50 rounded w-full"></div>
          <div className="h-12 bg-slate-50 rounded w-full"></div>
          <div className="h-12 bg-slate-50 rounded w-full"></div>
          <div className="h-12 bg-slate-50 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-rose-900">Failed to load tickets</h3>
        <p className="text-sm text-rose-600 mt-1">{error}</p>
        {onRetry && (
          <button onClick={onRetry} className="mt-4 rounded-lg border border-rose-200 bg-white px-3.5 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100">
            Try again
          </button>
        )}
      </div>
    );
  }

  if (!tickets || tickets.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
          <Inbox className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No tickets found</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          No support tickets matched your current search and filter criteria.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          {onResetFilters && (
            <button
              onClick={onResetFilters}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
            >
              Reset Filters
            </button>
          )}
          <Link
            to="/create-ticket"
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            Create New Ticket
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto" role="region" aria-label="Support tickets" tabIndex="0">
        <table className="w-full min-w-[820px] text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4">Ticket ID</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Subject</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tickets.map((ticket, index) => (
              <TicketRow key={ticket.ticket_id} ticket={ticket} isEven={index % 2 === 1} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Showing <strong className="text-slate-800">{tickets.length}</strong> of <strong className="text-slate-800">{totalTickets ?? tickets.length}</strong> ticket{(totalTickets ?? tickets.length) === 1 ? "" : "s"}
        </span>
        {onPageChange && totalTickets > pageSize ? (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button onClick={() => onPageChange(page - 1)} disabled={page === 1} className="rounded border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
            <span>Page {page} of {Math.ceil(totalTickets / pageSize)}</span>
            <button onClick={() => onPageChange(page + 1)} disabled={page >= Math.ceil(totalTickets / pageSize)} className="rounded border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400">Live Supabase PostgreSQL Database</span>
        )}
      </div>
    </div>
  );
}
