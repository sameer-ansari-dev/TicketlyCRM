import React from "react";
import { Link } from "react-router-dom";
import { HelpCircle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="page-container max-w-md text-center py-16">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-100 shadow-2xs">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">404</h1>
        <h2 className="text-xl font-bold text-slate-800 mt-2">Page Not Found</h2>
        <p className="text-sm text-slate-500 mt-2 mb-8">
          The support page or resource you requested does not exist or has been relocated.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-blue-500/10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
    </main>
  );
}
