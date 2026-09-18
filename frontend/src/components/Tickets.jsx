import React, { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import StatsCard from "./StatsCard";
import SearchBar from "./SearchBar";
import StatusFilter from "./StatusFilter";
import TicketTable from "./TicketTable";
import { getApiErrorMessage, getTickets, getTicketStats } from "../js/api";
import { useTicketRefresh } from "../js/ticketRefresh";
import {
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Download,
  RotateCw,
} from "lucide-react";

export default function Tickets() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const initialStatus = searchParams.get("status") || "";
  const initialPriority = searchParams.get("priority") || "";
  const initialSort = searchParams.get("sort") || "newest";

  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, in_progress: 0, closed: 0 });
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [priority, setPriority] = useState(initialPriority);
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Sync search input if URL params change
  useEffect(() => {
    const urlQuery = searchParams.get("search");
    if (urlQuery !== null && urlQuery !== search) {
      setSearch(urlQuery);
      setDebouncedSearch(urlQuery);
    }
  }, [searchParams]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (status) params.status = status;
      if (priority) params.priority = priority;
      if (sort !== "newest") params.sort = sort;
      setSearchParams(params, { replace: true });
    }, 250);
    return () => clearTimeout(timer);
  }, [search, status, priority, sort, setSearchParams]);

  // Load metrics
  const loadStats = useCallback(async () => {
    try {
      const data = await getTicketStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load ticket stats:", err);
    }
  }, []);

  // Load tickets matching search & status
  const loadTickets = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await getTickets({
        status: status || undefined,
        priority: priority || undefined,
        search: debouncedSearch || undefined,
        sort,
      });
      setTickets(data);
    } catch (err) {
      setError(err.userMessage || getApiErrorMessage(err));
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [status, priority, debouncedSearch, sort]);

  useEffect(() => {
    loadTickets();
    loadStats();
  }, [loadTickets, loadStats]);

  const refreshData = useCallback((isRefresh = false) => {
    loadTickets(isRefresh);
    loadStats();
  }, [loadTickets, loadStats]);
  useTicketRefresh(refreshData);

  useEffect(() => {
    setPage(1);
  }, [status, priority, debouncedSearch, sort]);

  // Export tickets to CSV
  const exportToCSV = () => {
    if (!tickets.length) return;
    const headers = ["Ticket ID", "Customer Name", "Customer Email", "Subject", "Status", "Priority", "Created At"];
    const rows = tickets.map((t) => [
      `"${t.ticket_id}"`,
      `"${t.customer_name}"`,
      `"${t.customer_email}"`,
      `"${t.subject}"`,
      `"${t.status}"`,
      `"${t.priority || "Medium"}"`,
      `"${t.created_at}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `support_tickets_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatus("");
    setPriority("");
    setSort("newest");
    setPage(1);
    setSearchParams({}, { replace: true });
  };

  return (
    <main className="page-container">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Support Tickets
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Search, filter, triage, and manage customer inquiries.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              loadTickets(true);
              loadStats();
            }}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-xs transition-colors"
            title="Refresh Tickets"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-blue-600" : "text-slate-500"}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={exportToCSV}
            disabled={!tickets.length}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
            title="Export Filtered Results as CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <Link
            to="/create-ticket"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Ticket</span>
          </Link>
        </div>
      </div>

      {/* Interactive Metric Filter Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Tickets"
          value={stats.total}
          color="text-blue-600"
          bgColor="bg-blue-50"
          icon={Ticket}
          isActive={status === ""}
          onClick={() => setStatus("")}
        />
        <StatsCard
          title="Open"
          value={stats.open}
          color="text-blue-600"
          bgColor="bg-blue-50"
          icon={AlertCircle}
          isActive={status === "Open"}
          onClick={() => setStatus(status === "Open" ? "" : "Open")}
        />
        <StatsCard
          title="In Progress"
          value={stats.in_progress}
          color="text-amber-600"
          bgColor="bg-amber-50"
          icon={Clock}
          isActive={status === "In Progress"}
          onClick={() => setStatus(status === "In Progress" ? "" : "In Progress")}
        />
        <StatsCard
          title="Closed"
          value={stats.closed}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
          icon={CheckCircle2}
          isActive={status === "Closed"}
          onClick={() => setStatus(status === "Closed" ? "" : "Closed")}
        />
      </div>

      {/* Search Bar & Filter Controls */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-6">
        <SearchBar search={search} setSearch={setSearch} />
        <div className="flex flex-col sm:flex-row gap-3">
          <StatusFilter status={status} setStatus={setStatus} stats={stats} />
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
            aria-label="Filter tickets by priority"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            aria-label="Sort tickets"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            <option value="newest">Newest first</option>
            <option value="priority">Priority: Critical first</option>
          </select>
        </div>
      </div>

      {/* Ticket Table */}
      <TicketTable
        tickets={tickets.slice((page - 1) * 10, page * 10)}
        loading={loading}
        error={error}
        onResetFilters={handleResetFilters}
        onRetry={() => loadTickets(true)}
        page={page}
        totalTickets={tickets.length}
        pageSize={10}
        onPageChange={(nextPage) => setPage(nextPage)}
      />
    </main>
  );
}
