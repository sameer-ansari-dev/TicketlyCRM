import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Clock } from "lucide-react";

export default function TicketRow({ ticket, isEven = false }) {
  const statusStyles = {
    Open: "bg-blue-50 text-blue-700 border-blue-200",
    "In Progress": "bg-amber-50 text-amber-800 border-amber-200",
    Closed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  const statusDotStyles = {
    Open: "bg-blue-600",
    "In Progress": "bg-amber-600",
    Closed: "bg-emerald-600",
  };

  const priorityStyles = {
    Urgent: "bg-rose-50 text-rose-700 border-rose-200",
    High: "bg-orange-50 text-orange-700 border-orange-200",
    Medium: "bg-blue-50 text-blue-700 border-blue-200",
    Low: "bg-slate-100 text-slate-600 border-slate-200",
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <tr
      className={`group transition-colors duration-150 hover:bg-blue-50/50 ${
        isEven ? "bg-slate-50/40" : "bg-white"
      }`}
    >
      {/* Ticket ID */}
      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-blue-600">
        <Link
          to={`/ticket/${ticket.ticket_id}`}
          className="hover:text-blue-800 hover:underline"
        >
          {ticket.ticket_id}
        </Link>
      </td>

      {/* Customer Info */}
      <td className="py-3.5 px-4">
        <div className="font-semibold text-slate-900 text-xs">
          {ticket.customer_name}
        </div>
        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
          {ticket.customer_email}
        </div>
      </td>

      {/* Subject */}
      <td className="py-3.5 px-4">
        <div className="text-xs font-medium text-slate-800 max-w-xs truncate">
          {ticket.subject}
        </div>
        {ticket.description && (
          <div className="text-[11px] text-slate-500 truncate max-w-sm mt-0.5">
            {ticket.description}
          </div>
        )}
      </td>

      {/* Status Badge */}
      <td className="py-3.5 px-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
            statusStyles[ticket.status] || "bg-slate-100 text-slate-600 border-slate-200"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              statusDotStyles[ticket.status] || "bg-slate-400"
            }`}
          />
          {ticket.status}
        </span>
      </td>

      {/* Priority Badge */}
      <td className="py-3.5 px-4">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${
            priorityStyles[ticket.priority] || priorityStyles.Medium
          }`}
        >
          {ticket.priority || "Medium"}
        </span>
      </td>

      {/* Created Date */}
      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          {formatDate(ticket.created_at)}
        </div>
      </td>

      {/* Action */}
      <td className="py-3.5 px-4 text-right">
        <Link
          to={`/ticket/${ticket.ticket_id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors"
        >
          View
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </td>
    </tr>
  );
}