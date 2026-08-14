import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  Outlet,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import DocumentsList from "./pages/DocumentsList";
import DocumentForm from "./pages/DocumentForm";
import DocumentDetail from "./pages/DocumentDetail";
import Report from "./pages/Report";
import "./App.css";

function ProtectedRoute() {
  const { user } = useAuth();
  if (user === undefined)
    return (
      <div className="max-w-5xl mx-auto px-6 py-8 text-slate-500">Loading…</div>
    );
  if (user === null) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/" replace /> : <Signup />}
        />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DocumentsList />} />
          <Route path="/documents/new" element={<DocumentForm />} />
          <Route path="/documents/:id" element={<DocumentDetail />} />
          <Route path="/documents/:id/edit" element={<DocumentForm />} />
          <Route path="/report" element={<Report />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
