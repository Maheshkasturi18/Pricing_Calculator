import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading, null = logged out
  const [error, setError] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get("/auth/me");
      if (data.user) {
        setUser(data.user);
        window.alert("Session restored. Welcome back!");
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setAuthChecking(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const u = await api.post("/auth/login", { email, password });
      setUser(u);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const signup = async (email, password) => {
    setError(null);
    try {
      const u = await api.post("/auth/signup", { email, password });
      setUser(u);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, error, login, signup, logout, authChecking }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
