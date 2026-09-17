import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import AppShell from "./AppShell";

const Dashboard = lazy(() => import("./Dashboard"));
const CreateTicket = lazy(() => import("./CreateTicket"));
const Tickets = lazy(() => import("./Tickets"));
const TicketDetails = lazy(() => import("./TicketDetails"));
const Analytics = lazy(() => import("./Analytics"));
const Customers = lazy(() => import("./Customers"));
const Settings = lazy(() => import("./Settings"));
const NotFound = lazy(() => import("./NotFound"));
const Login = lazy(() => import("./Login"));
const Signup = lazy(() => import("./Signup"));

function ProtectedRoutes() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <AuthLoading />;

  return user ? <AppShell /> : <Navigate to="/login" replace state={{ from: location }} />;
}

function AuthLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-3 text-sm text-slate-500" role="status">
      <span className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" aria-hidden="true" />
      Checking your session...
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-sm text-slate-500 font-medium"
          role="status"
        >
          Loading workspace...
        </div>
      }
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route element={<ProtectedRoutes />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-ticket" element={<CreateTicket />} />
          <Route path="/create" element={<Navigate to="/create-ticket" replace />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/ticket/:id" element={<TicketDetails />} />
          <Route path="/tickets/:id" element={<TicketDetails />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
