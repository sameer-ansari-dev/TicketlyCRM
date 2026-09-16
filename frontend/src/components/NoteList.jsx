import React from "react";
import { MessageSquare, Clock, User } from "lucide-react";

export default function NoteList({ notes }) {
  if (!notes || notes.length === 0) {
    return (
      <div className="py-8 text-center border border-dashed border-slate-300 bg-slate-50/60 rounded-xl">
        <MessageSquare className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm text-slate-700 font-semibold">No notes recorded yet</p>
        <p className="text-xs text-slate-500 mt-0.5">
          Add an internal note or status update below.
        </p>
      </div>
    );
  }

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <div
          key={note.id}
          className="group relative border-l-2 border-slate-200 pl-6 pb-2 last:pb-0"
        >
          <span className="absolute -left-[13px] top-0 flex h-6 w-6 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600">
            <User className="w-3.5 h-3.5" />
          </span>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-semibold text-slate-800">
              {note.author || "Support Agent"}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{formatTimestamp(note.created_at)}</span>
            </div>
          </div>
          <p className="rounded-xl rounded-tl-none border border-slate-200 bg-slate-50/80 p-3.5 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap shadow-xs">
            {note.note_text}
          </p>
        </div>
      ))}
    </div>
  );
}