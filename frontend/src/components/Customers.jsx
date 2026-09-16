import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getTickets } from "../js/api";
import {
  Users,
  Search,
  RotateCw,
  Mail,
  Ticket,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Inbox,
} from "lucide-react";

export default function Customers() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const loadData = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await getTickets();
      setTickets(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not load customers.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Aggregate tickets by customer email
  const customers = useMemo(() => {
    const map = new Map();

    tickets.forEach((t) => {
      const emailKey = (t.customer_email || "").toLowerCase().trim();
      if (!emailKey) return;

      if (!map.has(emailKey)) {
        map.set(emailKey, {
          name: t.customer_name || "Unknown Customer",
          email: t.customer_email,
          totalTickets: 0,
          openTickets: 0,
          inProgressTickets: 0,
          closedTickets: 0,
          latestDate: t.created_at,
          tickets: [],
        });
      }

      const item = map.get(emailKey);
      item.totalTickets += 1;
      if (t.status === "Open") item.openTickets += 1;
      else if (t.status === "In Progress") item.inProgressTickets += 1;
      else if (t.status === "Closed") item.closedTickets += 1;

      if (new Date(t.created_at) > new Date(item.latestDate)) {
        item.latestDate = t.created_at;
      }
      item.tickets.push(t);
    });

    return Array.from(map.values());
  }, [tickets]);

  // Filter customers by search term
  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const totalActive = useMemo(() => {
    return customers.reduce((sum, c) => sum + c.openTickets + c.inProgressTickets, 0);
  }, [customers]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <main className="page-container">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Customer Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Accounts and contacts who have submitted support requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-sm font-medium transition-colors shadow-2xs"
            title="Refresh Customers"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-600" : "text-slate-500"}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Customers
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              {customers.length}
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Inquiries
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              {totalActive}
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Resolved Cases
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              {tickets.length - totalActive}
            </p>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="mb-6 max-w-md relative">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer name or email..."
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all shadow-2xs"
        />
      </div>

      {/* Customer Table */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-slate-100 rounded w-full"></div>
            <div className="h-12 bg-slate-50 rounded w-full"></div>
            <div className="h-12 bg-slate-50 rounded w-full"></div>
            <div className="h-12 bg-slate-50 rounded w-full"></div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-rose-800">Failed to load customers</h3>
          <p className="text-sm text-rose-600 mt-1">{error}</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Inbox className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No customers found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {search ? "No customer accounts match your search filter." : "No customer records currently exist."}
          </p>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="mt-4 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-300 shadow-2xs"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-500 backdrop-blur">
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4 text-center">Total Tickets</th>
                  <th className="py-3.5 px-4 text-center">Open / In Progress</th>
                  <th className="py-3.5 px-4 text-center">Resolved</th>
                  <th className="py-3.5 px-4">Last Activity</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((cust) => {
                  const initials = cust.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase() || "CU";

                  return (
                    <tr
                      key={cust.email}
                      className="group border-b border-slate-100 transition-colors hover:bg-blue-50/40"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200">
                            {initials}
                          </div>
                          <span className="font-semibold text-slate-900 text-sm">
                            {cust.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate max-w-[200px]">{cust.email}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {cust.totalTickets}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            cust.openTickets + cust.inProgressTickets > 0
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "text-slate-400"
                          }`}
                        >
                          {cust.openTickets + cust.inProgressTickets}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {cust.closedTickets}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(cust.latestDate)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link
                          to={`/tickets?search=${encodeURIComponent(cust.email)}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md border border-blue-200/60 transition-all group-hover:translate-x-0.5"
                        >
                          View Tickets
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-800">{filteredCustomers.length}</strong> customer{filteredCustomers.length === 1 ? "" : "s"}
            </span>
            <span className="text-[11px] text-slate-400">Aggregated from Live Tickets</span>
          </div>
        </div>
      )}
    </main>
  );
}
