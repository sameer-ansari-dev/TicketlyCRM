import React, { useState, useEffect } from "react";
import StatsCard from "./StatsCard";
import { getTicketStats, getTickets } from "../js/api";
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  LifeBuoy,
  ShieldAlert,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function Analytics() {
  const [stats, setStats] = useState({ total: 0, open: 0, in_progress: 0, closed: 0 });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, ticketsData] = await Promise.all([
          getTicketStats(),
          getTickets(),
        ]);
        setStats(statsData);
        setTickets(ticketsData);
      } catch (err) {
        console.error("Failed to load analytics data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const total = stats.total || 0;
  const resolutionRate = total > 0 ? Math.round((stats.closed / total) * 100) : 0;
  const inProgressRate = total > 0 ? Math.round((stats.in_progress / total) * 100) : 0;
  const openRate = total > 0 ? Math.round((stats.open / total) * 100) : 0;

  const statusData = [
    { name: "Open", value: stats.open, color: "#2563eb" },
    { name: "In progress", value: stats.in_progress, color: "#f59e0b" },
    { name: "Closed", value: stats.closed, color: "#10b981" },
  ];
  const trendData = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => ({ day, tickets: tickets.filter((ticket) => new Date(ticket.created_at).getDay() === (index + 1) % 7).length }));

  // Priority distribution
  const priorityCounts = tickets.reduce((acc, t) => {
    const p = t.priority || "Medium";
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {});
  const priorityData = ["Urgent", "High", "Medium", "Low"].map((name) => ({ name, tickets: priorityCounts[name] || 0 }));

  return (
    <main className="page-container">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
                <TrendingUp className="w-3.5 h-3.5" />
                Performance & Health
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                CRM Analytics & Insights
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Real-time operational metrics, ticket resolution ratios, and team throughput.
              </p>
            </div>
          </div>

          {/* Core Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatsCard
              title="Total Volume"
              value={stats.total}
              color="text-blue-600"
              bgColor="bg-blue-50"
              icon={LifeBuoy}
            />
            <StatsCard
              title="Resolution Rate"
              value={`${resolutionRate}%`}
              color="text-emerald-600"
              bgColor="bg-emerald-50"
              icon={CheckCircle2}
            />
            <StatsCard
              title="Active Workload"
              value={stats.in_progress}
              color="text-amber-600"
              bgColor="bg-amber-50"
              icon={Clock}
            />
            <StatsCard
              title="Unassigned / Open"
              value={stats.open}
              color="text-rose-600"
              bgColor="bg-rose-50"
              icon={AlertCircle}
            />
          </div>

          {/* Breakdown Section */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-8">
            {/* Status Distribution */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Current queue</p>
                  <h3 className="text-base font-bold text-slate-900 mt-1">Status distribution</h3>
                </div>
                <BarChart3 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={74} paddingAngle={4} stroke="none">
                      {statusData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, color: "#0F172A", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.06)" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {statusData.map((item) => (
                  <div key={item.name}>
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                      <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                      {item.name}
                    </span>
                    <p className="mt-1 text-lg font-bold text-slate-900">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 xl:col-span-2 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Volume over time</p>
                  <h3 className="text-base font-bold text-slate-900 mt-1">Tickets created</h3>
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, color: "#0F172A", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.06)" }} />
                    <Line type="monotone" dataKey="tickets" stroke="#2563eb" strokeWidth={3} dot={{ fill: "#2563eb", r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 xl:col-span-2 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Work mix</p>
                  <h3 className="text-base font-bold text-slate-900 mt-1">Priority breakdown</h3>
                </div>
                <ShieldAlert className="w-4 h-4 text-amber-500" />
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityData} barSize={28}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                    <Tooltip cursor={{ fill: "rgba(37, 99, 235, 0.05)" }} contentStyle={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, color: "#0F172A", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.06)" }} />
                    <Bar dataKey="tickets" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Resolution health</p>
              <h3 className="text-base font-bold text-slate-900 mt-1 mb-5">SLA snapshot</h3>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-600 font-medium">Resolution rate</span>
                    <strong className="text-emerald-700 font-bold">{resolutionRate}%</strong>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${resolutionRate}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-600 font-medium">Active workload</span>
                    <strong className="text-amber-800 font-bold">{inProgressRate}%</strong>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-amber-500 transition-all duration-700" style={{ width: `${inProgressRate}%` }} />
                  </div>
                </div>
                <div className="border-t border-slate-200 pt-4">
                  <p className="text-2xl font-bold text-slate-900">{openRate}%</p>
                  <p className="text-xs text-slate-500 mt-1">of requests still need triage</p>
                </div>
              </div>
            </div>

            {/* Priority Distribution */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-blue-600" />
                Priority SLA Distribution
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-rose-50 p-3.5 rounded-xl border border-rose-200">
                  <span className="text-[11px] font-bold uppercase text-rose-700">Urgent</span>
                  <p className="text-2xl font-extrabold text-rose-900 mt-1">
                    {priorityCounts["Urgent"] || 0}
                  </p>
                  <span className="text-[10px] text-rose-600 mt-0.5 block font-medium">&lt; 2h target SLA</span>
                </div>

                <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200">
                  <span className="text-[11px] font-bold uppercase text-amber-800">High</span>
                  <p className="text-2xl font-extrabold text-amber-900 mt-1">
                    {priorityCounts["High"] || 0}
                  </p>
                  <span className="text-[10px] text-amber-700 mt-0.5 block font-medium">&lt; 8h target SLA</span>
                </div>

                <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-200">
                  <span className="text-[11px] font-bold uppercase text-blue-700">Medium</span>
                  <p className="text-2xl font-extrabold text-blue-900 mt-1">
                    {priorityCounts["Medium"] || 0}
                  </p>
                  <span className="text-[10px] text-blue-600 mt-0.5 block font-medium">&lt; 24h standard</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold uppercase text-slate-600">Low</span>
                  <p className="text-2xl font-extrabold text-slate-800 mt-1">
                    {priorityCounts["Low"] || 0}
                  </p>
                  <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">Backlog triage</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick link back to ticket operations */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-bold text-slate-900">Need to resolve pending tickets?</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Switch over to the live dashboard to search, filter, and inspect support cases.
              </p>
            </div>
            <Link
              to="/dashboard"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-blue-500/10"
            >
              Go to Dashboard
            </Link>
          </div>
    </main>
  );
}