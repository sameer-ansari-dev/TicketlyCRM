import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import StatsCard from "./StatsCard";
import TicketTable from "./TicketTable";
import { getApiErrorMessage, getTickets, getTicketStats } from "../js/api";
import { useTicketRefresh } from "../js/ticketRefresh";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  RotateCw,
  Ticket,
  TrendingUp,
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    in_progress: 0,
    closed: 0,
    priorities: { Low: 0, Medium: 0, High: 0, Critical: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [statsData, ticketsData] = await Promise.all([
        getTicketStats(),
        getTickets(),
      ]);
      setStats(statsData);
      setTickets(ticketsData);
    } catch (err) {
      setError(err.userMessage || getApiErrorMessage(err));
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);
  useTicketRefresh(loadData);

  // Quick navigate to Tickets filtered by status
  const handleCardClick = (statusFilter) => {
    if (statusFilter) {
      navigate(`/tickets?status=${encodeURIComponent(statusFilter)}`);
    } else {
      navigate("/tickets");
    }
  };

  // Recent 6 tickets for the dashboard preview
  const recentTickets = tickets.slice(0, 6);

  return (
    <main className="page-container">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Workspace Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time summary of support operations, key metrics, and active inquiries.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-xs transition-colors"
            title="Refresh Overview"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-blue-600" : "text-slate-500"}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            to="/tickets"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-xs transition-colors"
          >
            <Ticket className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">All Tickets</span>
          </Link>

          <Link
            to="/create-ticket"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Ticket</span>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Tickets"
          value={stats.total}
          color="text-blue-600"
          bgColor="bg-blue-50"
          icon={Ticket}
          onClick={() => handleCardClick("")}
        />
        <StatsCard
          title="Open"
          value={stats.open}
          color="text-blue-600"
          bgColor="bg-blue-50"
          icon={AlertCircle}
          onClick={() => handleCardClick("Open")}
        />
        <StatsCard
          title="In Progress"
          value={stats.in_progress}
          color="text-amber-600"
          bgColor="bg-amber-50"
          icon={Clock}
          onClick={() => handleCardClick("In Progress")}
        />
        <StatsCard
          title="Closed"
          value={stats.closed}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
          icon={CheckCircle2}
          onClick={() => handleCardClick("Closed")}
        />
      </div>

      <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Priority workload</h2>
            <p className="text-xs text-slate-500">Focus urgent customer impact first.</p>
          </div>
          <Link to="/tickets?sort=priority" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
            View priority queue
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            ["Critical", "bg-rose-50 border-rose-200 text-rose-700"],
            ["High", "bg-orange-50 border-orange-200 text-orange-700"],
            ["Medium", "bg-blue-50 border-blue-200 text-blue-700"],
            ["Low", "bg-slate-100 border-slate-200 text-slate-700"],
          ].map(([priority, colors]) => (
            <button
              key={priority}
              onClick={() => navigate(`/tickets?priority=${priority}&sort=priority`)}
              className={`rounded-lg border px-4 py-3 text-left transition-colors hover:brightness-95 ${colors}`}
            >
              <span className="block text-[11px] font-bold uppercase tracking-wider">{priority}</span>
              <span className="mt-1 block text-2xl font-bold">{stats.priorities?.[priority] || 0}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Quick Action Banner */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-1.5 text-blue-700 text-xs font-bold uppercase tracking-wider mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Support Pipeline
          </div>
          <h2 className="text-base font-bold text-slate-900">
            {stats.open} ticket{stats.open === 1 ? "" : "s"} require triage today
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Keep resolution times low by addressing open customer cases promptly.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/tickets?status=Open"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-blue-700 text-xs font-semibold transition-colors border border-blue-200 shadow-xs"
          >
            Review Open Tickets
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Recent Tickets Section */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Recent Inquiries</h2>
          <p className="text-xs text-slate-500">
            Latest customer submissions across all channels
          </p>
        </div>
        <Link
          to="/tickets"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          View All Tickets ({tickets.length})
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Ticket Table Preview */}
      <TicketTable
        tickets={recentTickets}
        loading={loading}
        error={error}
      />
    </main>
  );
}
