import { useState } from "react";
import { FiArrowLeft, FiMail, FiCheckCircle } from "react-icons/fi";

import { useAuth } from "../context/AuthContext";

import "./ForgotPassword.css";

export default function ForgotPassword({ onBack }) {
  const { requestPasswordReset } = useAuth();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    setSubmitting(true);

    try {
      await requestPasswordReset(cleanEmail);

      setMessage(
        "If this email belongs to an authorized JWANDOON account, a password reset link has been sent.",
      );
    } catch (error) {
      console.error(error);

      setError(error?.message || "Unable to send the password reset email.");
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
          <h1>Reset your password</h1>

          <p>
            Enter your authorized business email and we'll send you a secure
            link to create a new password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <div className="auth-input-icon">
              <FiMail />

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                autoFocus
                required
              />
            </div>
          </label>

          {error && <p className="auth-error">{error}</p>}

          {message && (
            <div className="auth-success auth-reset-success">
              <FiCheckCircle />
              <span>{message}</span>
            </div>
          )}

          <button type="submit" disabled={submitting}>
            {submitting ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <button type="button" className="auth-back-link" onClick={onBack}>
          <FiArrowLeft />
          Back to login
        </button>

        <p className="auth-security">Authorized Jwandoon personnel only.</p>
      </div>
    </main>
  );
}
