import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { getSystemHealth } from "../js/api";
import toast from "react-hot-toast";
import {
  Settings as SettingsIcon,
  User,
  Shield,
  CheckCircle2,
  CircleAlert,
  Save,
  Server,
} from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const [ticketView, setTicketView] = useState("all");
  const [autoRefresh, setAutoRefresh] = useState("30");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      try {
        const response = await getSystemHealth();
        if (isMounted) setHealth(response);
      } catch {
        if (isMounted) {
          setHealth({
            api: "unavailable",
            database: "disconnected",
            database_type: "Supabase PostgreSQL",
            version: "1.0.0",
          });
        }
      } finally {
        if (isMounted) {
          setLastChecked(new Date());
          setHealthLoading(false);
        }
      }
    };

    checkHealth();
    const refreshTimer = window.setInterval(checkHealth, 30_000);
    return () => {
      isMounted = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    toast.success("Preferences saved successfully");
  };

  return (
    <main className="page-container max-w-4xl">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
          <SettingsIcon className="w-3.5 h-3.5" />
          Workspace Configuration
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          TicketlyCRM Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your support agent profile and system preferences.
        </p>
      </div>

      <div className="space-y-6">
        {/* Agent Profile Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-6">
            <User className="w-4 h-4 text-blue-600" />
            Support Agent Profile
          </h2>

          <div className="flex flex-col sm:flex-row sm:items-center gap-6 pb-6 border-b border-slate-200">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-sm flex-shrink-0">
              {user ? user.slice(0, 2).toUpperCase() : "TK"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{user || "Support Agent"}</h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">Role: Customer Operations Specialist</p>
              <p className="text-xs text-slate-400 mt-0.5">Workspace: TicketlyCRM Operations Team</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                CRM Account ID
              </label>
              <input
                type="text"
                readOnly
                value={user || "TicketlyCRM"}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700 cursor-not-allowed font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Assigned Queue
              </label>
              <input
                type="text"
                readOnly
                value="General Support / Inbound Tier-1"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700 cursor-not-allowed font-medium"
              />
            </div>
          </div>
        </div>

        {/* Preferences Form */}
        <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-6">
            <Shield className="w-4 h-4 text-emerald-600" />
            CRM & View Preferences
          </h2>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Default Ticket Filter
                </label>
                <select
                  value={ticketView}
                  onChange={(e) => setTicketView(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 shadow-2xs"
                >
                  <option value="all">All Inquiries</option>
                  <option value="open">Open Tickets Only</option>
                  <option value="in_progress">In Progress Tickets Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Background Refresh Rate
                </label>
                <select
                  value={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 shadow-2xs"
                >
                  <option value="manual">Manual Only</option>
                  <option value="15">Every 15 seconds</option>
                  <option value="30">Every 30 seconds</option>
                  <option value="60">Every 60 seconds</option>
                </select>
              </div>
            </div>

            <div className="pt-3">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500 focus:ring-offset-white"
                />
                <span className="text-sm text-slate-700">
                  Enable desktop toast updates for ticket status changes
                </span>
              </label>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm shadow-blue-500/10"
            >
              <Save className="w-3.5 h-3.5" />
              Save Preferences
            </button>
          </div>
        </form>

        {/* System & Backend Status */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-600" />
              Backend & Database Health
            </h2>
            <p className="text-xs text-slate-400" aria-live="polite">
              {lastChecked ? `Last checked ${lastChecked.toLocaleTimeString()}` : "Checking system health..."}
            </p>
          </div>

          {healthLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-label="Loading system health">
              {["api", "database", "application"].map((card) => (
                <div key={card} className="h-28 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <HealthCard
                label="API Service"
                title="FastAPI REST API"
                description="RESTful backend powered by FastAPI"
                status={health?.api === "operational" ? "Operational" : "Unavailable"}
                healthy={health?.api === "operational"}
              />
              <HealthCard
                label="Database Engine"
                title={health?.database_type || "Supabase PostgreSQL"}
                description="Cloud-hosted PostgreSQL Database"
                status={health?.database === "connected" ? "Connected" : "Disconnected"}
                healthy={health?.database === "connected"}
              />
              <HealthCard
                label="Application"
                title="TicketlyCRM"
                description={`Version v${health?.version || "1.0.0"}`}
                status="Live"
                healthy
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function HealthCard({ label, title, description, status, healthy }) {
  const StatusIcon = healthy ? CheckCircle2 : CircleAlert;
  const statusColor = healthy ? "text-emerald-700" : "text-rose-700";
  const iconColor = healthy ? "text-emerald-600" : "text-rose-600";

  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-sm font-bold text-slate-900 mt-1 truncate" title={title}>{title}</p>
      <p className="text-xs text-slate-500 mt-1 min-h-5">{description}</p>
      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold mt-2 ${statusColor}`}>
        <StatusIcon className={`w-3.5 h-3.5 ${iconColor}`} /> {status}
      </span>
    </div>
  );
}
