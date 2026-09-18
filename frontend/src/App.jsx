import AppRoutes from "./components/AppRoutes";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <>
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
      <Toaster position="bottom-right" toastOptions={{ style: { background: "#0f172a", color: "#f8fafc", border: "1px solid #1e293b" } }} />
    </>
  );
}

export default App;
