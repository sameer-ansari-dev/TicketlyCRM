import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createTicket } from "../js/api";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Send,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function CreateTicket() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    subject: "",
    description: "",
    priority: "Medium",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Basic Validation
    if (!formData.customer_name.trim()) {
      setError("Please enter the customer's full name.");
      return;
    }
    if (!formData.customer_email.trim() || !formData.customer_email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!formData.subject.trim()) {
      setError("Please enter a ticket subject/title.");
      return;
    }
    if (!formData.description.trim()) {
      setError("Please describe the customer's issue or request.");
      return;
    }

    try {
      setLoading(true);
      const res = await createTicket(formData);
      setSuccessInfo(res);
      toast.success("Ticket created successfully");

      // Auto-redirect to the newly created ticket after 1.5s
      setTimeout(() => {
        navigate(`/ticket/${res.ticket_id}`);
      }, 1200);
    } catch (err) {
      toast.error("Could not create ticket");
      setError(
        err.response?.data?.detail || "Failed to create support ticket. Please check backend."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-container max-w-3xl">
          <Link
            to="/tickets"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tickets
          </Link>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                New Inbound Request
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Create Support Ticket
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Enter ticket details. An official ticket ID and timestamp will be auto-generated.
              </p>
            </div>

            <div className="p-6 sm:p-8">
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {successInfo && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800 text-sm">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
                  <div>
                    <strong className="block font-semibold">
                      Ticket {successInfo.ticket_id} created successfully!
                    </strong>
                    <span className="text-xs text-emerald-600">
                      Redirecting to ticket details...
                    </span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Customer Name */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                      Customer Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="customer_name"
                      placeholder="e.g. Rachel Green"
                      value={formData.customer_name}
                      onChange={handleChange}
                      disabled={loading || successInfo}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all shadow-2xs"
                    />
                  </div>

                  {/* Customer Email */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                      Customer Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="customer_email"
                      placeholder="rachel@company.com"
                      value={formData.customer_email}
                      onChange={handleChange}
                      disabled={loading || successInfo}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {/* Subject */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                      Subject / Issue Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="subject"
                      placeholder="e.g. Cannot connect Stripe webhook in production"
                      value={formData.subject}
                      onChange={handleChange}
                      disabled={loading || successInfo}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all shadow-2xs"
                    />
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                      Priority Level
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      disabled={loading || successInfo}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all shadow-2xs"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                    Detailed Issue Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows="6"
                    name="description"
                    placeholder="Provide full context, error codes, steps to reproduce, or relevant links..."
                    value={formData.description}
                    onChange={handleChange}
                    disabled={loading || successInfo}
                    className="w-full p-4 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all leading-relaxed shadow-2xs"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-200">
                  <Link
                    to="/tickets"
                    className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg transition-colors shadow-2xs"
                  >
                    Cancel
                  </Link>

                  <button
                    type="submit"
                    disabled={loading || successInfo}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all shadow-sm shadow-blue-500/10 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{loading ? "Creating Ticket..." : "Submit Ticket"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
    </main>
  );
}