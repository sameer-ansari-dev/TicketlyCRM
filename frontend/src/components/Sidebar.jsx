import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  Ticket,
  BarChart3,
  Users,
  Settings,
  LifeBuoy,
  X,
} from "lucide-react";

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  const navItems = [
    { path: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { path: "/create-ticket", label: "Create Ticket", icon: PlusCircle },
    { path: "/tickets", label: "Tickets", icon: Ticket },
    { path: "/analytics", label: "Analytics", icon: BarChart3 },
    { path: "/customers", label: "Customers", icon: Users },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  const isItemActive = (path) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard" || location.pathname === "/";
    }
    if (path === "/tickets") {
      return location.pathname === "/tickets" || location.pathname.startsWith("/ticket/");
    }
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <button
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
          aria-label="Close navigation menu"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white px-3 py-4 shadow-sm transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-3 mb-6">
          <Link
            to="/dashboard"
            onClick={onClose}
            className="flex items-center gap-2.5 text-slate-900 font-bold tracking-tight text-base"
          >
            <span className="brand-mark">
              <LifeBuoy className="w-4 h-4 text-white" />
            </span>
            <span>Ticketly<span className="text-blue-600">CRM</span></span>
          </Link>
          <button
            onClick={onClose}
            className="icon-button lg:hidden"
            aria-label="Close navigation menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Clean Workspace Indicator */}
        <div className="px-3 mb-5">
          <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
            <span className="text-xs font-semibold text-slate-700 truncate">
              TicketlyCRM Workspace
            </span>
          </div>
        </div>

        {/* Clean Nav Links */}
        <nav className="flex-1 space-y-1 px-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = isItemActive(path);
            return (
              <Link
                key={path}
                to={path}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-blue-600" : "text-slate-400"}`} />
                <span className="flex-1">{label}</span>
                {active && (
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}