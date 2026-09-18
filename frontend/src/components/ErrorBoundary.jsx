import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("TicketlyCRM rendering error", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-5">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-500">The workspace could not be displayed. Please try again.</p>
          <button onClick={this.handleReset} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
        </section>
      </main>
    );
  }
}
