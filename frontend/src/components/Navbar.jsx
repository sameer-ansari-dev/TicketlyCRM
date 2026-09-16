import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Plus, Search, LogOut } from "lucide-react";
import { useAuth } from "./AuthContext";

export default function Navbar({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [headerSearch, setHeaderSearch] = useState("");

  // Determine current page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/" || path === "/dashboard") return "Overview";
    if (path === "/create-ticket" || path === "/create") return "Create Ticket";
    if (path === "/tickets") return "Tickets";
    if (path === "/analytics") return "Analytics";
    if (path === "/customers") return "Customers";
    if (path === "/settings") return "Settings";
    if (path.startsWith("/ticket/")) return "Ticket Details";
    return "TicketlyCRM";
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (headerSearch.trim()) {
      navigate(`/tickets?search=${encodeURIComponent(headerSearch.trim())}`);
      setHeaderSearch("");
    }
  };

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-slate-200 bg-white shadow-sm">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu & Page Title / Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden icon-button"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>

          <Link
            to="/dashboard"
            className="lg:hidden flex items-center gap-2 text-slate-900 font-bold"
          >
            <img
              src="/apple-touch-icon.png"
              alt="TicketlyCRM Favicon"
              className="w-7 h-7 rounded-lg object-contain shadow-xs"
            />
            <span>Ticketly<span className="text-blue-600">CRM</span></span>
          </Link>

          {/* Breadcrumb / Page Title */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <span>Workspace</span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-900">{getPageTitle()}</span>
          </div>
        </div>

        {/* Center: Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex flex-1 max-w-md relative"
        >
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={headerSearch}
            onChange={(e) => setHeaderSearch(e.target.value)}
            aria-label="Search tickets"
            placeholder="Search tickets by ID, customer, subject..."
            className="w-full rounded-lg border border-slate-200 bg-slate-100/90 py-2 pl-9 pr-12 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
          <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 uppercase tracking-wider font-mono border border-slate-200 rounded px-1.5 py-0.5 bg-white">
            ↵
          </span>
        </form>

        {/* Right: New Ticket & User Avatar */}
        <div className="flex items-center gap-3">
          <Link
            to="/create-ticket"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Ticket</span>
          </Link>

          <div className="h-6 w-px bg-slate-200" />

          {/* User Profile Avatar with Logout */}
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100 transition-colors group text-left"
            title={`Signed in as ${user || "Agent"}. Click to sign out.`}
          >
            <span className="avatar">
              {user?.slice(0, 2).toUpperCase() || "SC"}
            </span>
            <span className="hidden xl:block">
              <span className="block text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                {user || "Support Agent"}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                <span className="status-dot" />
                Online
              </span>
            </span>
            <LogOut className="hidden xl:block w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 transition-colors ml-1" />
          </button>
        </div>
      </div>
    </header>
  );
}