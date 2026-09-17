import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, LockKeyhole, UserRound } from "lucide-react";
import { useAuth } from "./AuthContext";

export default function Login() {
  const { user, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (isLoading) {
    return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-sm text-slate-500" role="status">Checking your session...</div>;
  }

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    if (login(username, password)) {
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } else {
      setError("Invalid CRM ID or password.");
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.08),_transparent_50%)] pointer-events-none" />
      <section className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm mb-4 p-2.5">
            <img src="/apple-touch-icon.png" alt="TicketlyCRM Favicon" className="w-full h-full object-contain rounded-xl" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">TicketlyCRM</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mt-1">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-1.5">Sign in to manage your customer operations.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          {error && <p className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2" htmlFor="username">CRM ID</label>
          <div className="relative mb-5">
            <UserRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input id="username" value={username} onChange={(event) => setUsername(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs" placeholder="Enter your CRM ID" autoComplete="username" required />
          </div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2" htmlFor="password">Password</label>
          <div className="relative mb-6">
            <LockKeyhole className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs" placeholder="Enter your password" autoComplete="current-password" required />
          </div>
          <button type="submit" className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-500/10 transition-colors hover:bg-blue-700">
            Sign in <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-center text-sm text-slate-500 mt-6">New to TicketlyCRM? <Link to="/signup" className="font-semibold text-blue-600 hover:text-blue-700">Create an account</Link></p>
        </form>
      </section>
    </main>
  );
}
