import { useState } from "react";
import { FiLock, FiCheckCircle } from "react-icons/fi";

import { useAuth } from "../context/AuthContext";

import "./ResetPassword.css";

export default function ResetPassword() {
  const { updateUserPassword } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters long.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      await updateUserPassword(password);

      setMessage(
        "Your password has been updated successfully.",
      );

      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);

      setError(
        error?.message ||
          "Unable to update your password.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleReturnToLogin() {
    window.location.href = "/";
  }

  return (
    <main className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <span>JWANDOON</span>
          <p>BUSINESS MANAGEMENT</p>
        </div>

        <div className="auth-heading">
          <h1>Reset password</h1>

          <p>
            Create a new password for your JWANDOON
            Business account.
          </p>
        </div>

        {message ? (
          <div className="reset-complete">
            <div className="reset-complete-icon">
              <FiCheckCircle />
            </div>

            <h2>Password updated</h2>

            <p>
              Your password has been changed successfully.
              You can now return to login and sign in with
              your new password.
            </p>

            <button
              type="button"
              onClick={handleReturnToLogin}
            >
              Back to login
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="auth-form"
          >
            <label>
              New password

              <div className="auth-input-icon">
                <FiLock />

                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  minLength={8}
                  autoFocus
                  required
                />
              </div>
            </label>

            <label>
              Confirm new password

              <div className="auth-input-icon">
                <FiLock />

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value,
                    )
                  }
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
            </label>

            <p className="reset-password-hint">
              Use at least 8 characters.
            </p>

            {error && (
              <p className="auth-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={
                submitting ||
                !password ||
                !confirmPassword
              }
            >
              {submitting
                ? "Updating..."
                : "Update password"}
            </button>
          </form>
        )}

        <p className="auth-security">
          Authorized Jwandoon personnel only.
        </p>
      </div>
    </main>
  );
}