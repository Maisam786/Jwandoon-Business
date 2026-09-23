import { useEffect, useState } from "react";

import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Products from "./pages/Products";
import Billing from "./pages/Billing";
import Sales from "./pages/Sales";
import Reports from "./pages/Reports";

import { AuthProvider, useAuth } from "./context/AuthContext";

import "./App.css";
import "./index.css";

function ProtectedApp() {
  const { profile, loading, isAuthenticated } = useAuth();
  const [activePage, setActivePage] = useState("dashboard");

  useEffect(() => {
    function handleDashboardNavigation(event) {
      setActivePage(event.detail);
    }

    window.addEventListener("jwandoon:navigate", handleDashboardNavigation);

    return () => {
      window.removeEventListener(
        "jwandoon:navigate",
        handleDashboardNavigation,
      );
    };
  }, []);

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner" />
        <p>Loading Jwandoon Business...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  function renderPage() {
    switch (activePage) {
      case "dashboard":
        return <Dashboard />;

      case "billing":
        return <Billing />;

      case "inventory":
        return <Inventory />;

      case "products":
        return <Products />;

      case "sales":
        return <Sales />;

      case "reports":
        return <Reports />;

      default:
        return <Dashboard />;
    }
  }

  return (
    <AppLayout
      activePage={activePage}
      onNavigate={setActivePage}
      profile={profile}
    >
      {renderPage()}
    </AppLayout>
  );
}

function LoginScreen() {
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      await signIn(email, password);
    } catch (error) {
      console.error(error);

      setError(
        error?.message || "Unable to sign in. Please check your credentials.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <span>JWANDOON</span>
          <p>BUSINESS MANAGEMENT</p>
        </div>

        <div className="auth-heading">
          <h1>Welcome back</h1>
          <p>Sign in to access your business dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="auth-security">Authorized Jwandoon personnel only.</p>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProtectedApp />
    </AuthProvider>
  );
}
