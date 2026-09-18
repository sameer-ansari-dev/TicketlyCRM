import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import NoteList from "./NoteList";
import { getTicketById, updateTicket, addTicketNote, notifyTicketDataChanged, uploadTicketAttachment } from "../js/api";
import { useTicketRefresh } from "../js/ticketRefresh";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Mail,
  User,
  Clock,
  Send,
  AlertCircle,
  CheckCircle2,
  Tag,
  Calendar,
  MessageSquare,
  Sparkles,
  Paperclip,
  Download,
} from "lucide-react";

export default function TicketDetails() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status updating state
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Note addition state
  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [noteError, setNoteError] = useState(null);

  const loadTicket = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const data = await getTicketById(id);
      setTicket(data);
    } catch (err) {
      setError(
        err.response?.data?.detail || `Ticket '${id}' could not be retrieved.`
      );
    } finally {
      if (!isRefresh) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);
  useTicketRefresh(loadTicket);

  // Handle status update
  const handleStatusChange = async (newStatus) => {
    if (!ticket || ticket.status === newStatus) return;
    try {
      setUpdatingStatus(true);
      setStatusMessage(null);
      const res = await updateTicket(ticket.ticket_id, { status: newStatus });
      setTicket((prev) => ({
        ...prev,
        status: newStatus,
        updated_at: res.updated_at,
      }));
      setStatusMessage(`Status updated to "${newStatus}"`);
      notifyTicketDataChanged();
      toast.success(`Status updated to ${newStatus}`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      toast.error("Failed to update status");
      alert(err.response?.data?.detail || "Failed to update status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle adding a new note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    try {
      setAddingNote(true);
      setNoteError(null);
      const newNote = await addTicketNote(ticket.ticket_id, {
        note_text: noteText.trim(),
        author: "Support Agent",
      });

      // Update notes list in local state
      setTicket((prev) => ({
        ...prev,
        updated_at: new Date().toISOString(),
        notes: [newNote, ...(prev.notes || [])],
      }));
      setNoteText("");
      notifyTicketDataChanged();
      toast.success("Note added");
    } catch (err) {
      toast.error("Failed to add note");
      setNoteError(err.response?.data?.detail || "Failed to add note.");
    } finally {
      setAddingNote(false);
    }
  };

  const handleAttachmentUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !ticket) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Attachment must be 10 MB or smaller");
      event.target.value = "";
      return;
    }
    try {
      const attachment = await uploadTicketAttachment(ticket.ticket_id, file);
      setTicket((current) => ({ ...current, attachments: [attachment, ...(current.attachments || [])] }));
      notifyTicketDataChanged();
      toast.success("Attachment uploaded");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Attachment upload failed");
    } finally {
      event.target.value = "";
    }
  };

  const formatDate = (dateStr) => {
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

  if (loading) {
    return (
      <div className="page-container">
        <div className="max-w-5xl mx-auto p-6 w-full animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-64 bg-white border border-slate-200 rounded-2xl"></div>
          <div className="h-64 bg-white border border-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="page-container">
        <main className="max-w-lg mx-auto px-4 py-20 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Ticket Not Found</h2>
          <p className="text-slate-500 text-sm mb-6">{error || `Ticket ${id} does not exist.`}</p>
          <Link
            to="/tickets"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Tickets
          </Link>
        </main>
      </div>
    );
  }

  const statusStyles = {
    Open: "bg-blue-50 text-blue-700 border-blue-200",
    "In Progress": "bg-amber-50 text-amber-800 border-amber-200",
    Closed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  const priorityStyles = {
    Critical: "text-rose-700 bg-rose-50 border-rose-200",
    High: "text-amber-800 bg-amber-50 border-amber-200",
    Medium: "text-blue-700 bg-blue-50 border-blue-200",
    Low: "text-slate-600 bg-slate-100 border-slate-200",
  };

  return (
    <main className="page-container max-w-5xl">
          {/* Top navigation & Action bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <Link
              to="/tickets"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Tickets
            </Link>

            {/* Status notification toast */}
            {statusMessage && (
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg animate-fadeIn">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{statusMessage}</span>
              </div>
            )}
          </div>

          {/* Ticket Header Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
            <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-base sm:text-lg font-bold text-blue-600">
                      {ticket.ticket_id}
                    </span>
                    <span
                      className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold border ${
                        statusStyles[ticket.status] || "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {ticket.status}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                        priorityStyles[ticket.priority] || priorityStyles.Medium
                      }`}
                    >
                      {ticket.priority || "Medium"} Priority
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {ticket.subject}
                  </h1>
                </div>

                {/* Status Switcher */}
                <div className="flex flex-col items-start sm:items-end gap-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Update Status
                  </span>
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
                    {["Open", "In Progress", "Closed"].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        disabled={updatingStatus}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                          ticket.status === s
                            ? "bg-blue-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Details & Metadata Grid */}
            <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-slate-200 bg-white">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Customer Name
                  </p>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">
                    {ticket.customer_name}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Customer Email
                  </p>
                  <a
                    href={`mailto:${ticket.customer_email}`}
                    className="text-sm font-semibold text-blue-600 hover:underline mt-0.5 block truncate max-w-[200px]"
                  >
                    {ticket.customer_email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Timestamps
                  </p>
                  <p className="text-xs text-slate-700 mt-0.5">
                    Created: {formatDate(ticket.created_at)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Updated: {formatDate(ticket.updated_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Ticket Description */}
            <div className="p-6 sm:p-8 bg-white">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Issue Description
              </h3>
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </div>
            </div>

            <div className="border-t border-slate-200 p-6 sm:p-8 bg-white">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Attachments</h3>
                  <p className="mt-1 text-xs text-slate-500">JPG, PNG, PDF, DOC, or DOCX up to 10 MB.</p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100">
                  <Paperclip className="h-3.5 w-3.5" /> Add attachment
                  <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" onChange={handleAttachmentUpload} />
                </label>
              </div>
              {ticket.attachments?.length ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {ticket.attachments.map((attachment) => (
                    <div key={attachment.id} className="rounded-lg border border-slate-200 p-3">
                      {attachment.content_type?.startsWith("image/") && (
                        <img src={attachment.url} alt={attachment.original_name} className="mb-3 max-h-40 w-full rounded object-contain bg-slate-50" />
                      )}
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-xs font-medium text-slate-700">{attachment.original_name}</span>
                        <a href={attachment.url} download={attachment.original_name} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"><Download className="h-3.5 w-3.5" /> Download</a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-500">No attachments yet.</p>}
            </div>
          </div>

          {/* Notes & Collaboration Timeline */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  Internal Notes & Activity Log
                </h3>
                <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full ml-1 border border-slate-200">
                  {ticket.notes ? ticket.notes.length : 0}
                </span>
              </div>
              <span className="text-xs text-slate-500">Visible to support team</span>
            </div>

            {/* List existing notes */}
            <div className="mb-8">
              <NoteList notes={ticket.notes} />
            </div>

            {/* Add Note Form */}
            <form onSubmit={handleAddNote} className="space-y-4">
              {noteError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                  {noteError}
                </div>
              )}

              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Add Team Note / Status Update
              </label>

              <textarea
                rows="4"
                placeholder="Document your findings, escalation details, customer phone calls, or steps taken..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                disabled={addingNote}
                className="w-full p-4 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all shadow-2xs"
              />

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Notes are stamped with your agent name and UTC timestamp.
                </span>
                <button
                  type="submit"
                  disabled={addingNote || !noteText.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all shadow-sm shadow-blue-500/10 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{addingNote ? "Saving..." : "Save Note"}</span>
                </button>
              </div>
            </form>
          </div>
    </main>
  );
}
