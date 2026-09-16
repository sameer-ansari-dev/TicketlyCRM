import AppRoutes from "./components/AppRoutes";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <AppRoutes />
      <Toaster position="bottom-right" toastOptions={{ style: { background: "#0f172a", color: "#f8fafc", border: "1px solid #1e293b" } }} />
    </>
  );
}

export default App;