import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, LockKeyhole, UserRound } from "lucide-react";
import { useAuth } from "./AuthContext";

export default function Signup() {
  const { user, signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");
    if (form.username.trim().length < 4 || form.password.length < 6) {
      setError("Use a CRM ID with 4+ characters and a password with 6+ characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!signup(form.username, form.password)) {
      setError("That CRM ID is already registered.");
      return;
    }
    navigate("/login", { replace: true, state: { message: "Account created. Sign in to continue." } });
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.08),_transparent_50%)] pointer-events-none" />
      <section className="relative w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="inline-flex w-12 h-12 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-2xs mb-3 p-2">
            <img src="/apple-touch-icon.png" alt="TicketlyCRM Favicon" className="w-full h-full object-contain rounded-lg" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">TicketlyCRM Access</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mt-1">Create your account</h1>
          <p className="text-sm text-slate-500 mt-1.5 mb-7">Set up a local TicketlyCRM profile for this browser.</p>
          {error && <p className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2" htmlFor="signup-username">CRM ID</label>
              <div className="relative">
                <UserRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input id="signup-username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs" placeholder="Choose a CRM ID (min 4 chars)" autoComplete="username" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2" htmlFor="signup-password">Password</label>
              <div className="relative">
                <LockKeyhole className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input id="signup-password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs" placeholder="Choose a password (min 6 chars)" autoComplete="new-password" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2" htmlFor="confirm-password">Confirm password</label>
              <input id="confirm-password" type="password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} className="w-full rounded-lg border border-slate-300 bg-white py-2.5 px-3.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs" placeholder="Re-enter password" autoComplete="new-password" required />
            </div>
            <button type="submit" className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-500/10 hover:bg-blue-700 transition-colors">
              Create account <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}