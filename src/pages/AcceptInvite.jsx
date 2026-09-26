import { useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiLock,
  FiMail,
  FiShield,
} from "react-icons/fi";
import "./AcceptInvite.css";

import { supabase } from "../services/supabase";

export default function AcceptInvite() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initializeInvite() {
      try {
        setError("");

        /*
         * Supabase Auth processes the invitation URL and creates
         * the temporary authenticated session.
         */
        const {
          data: { session: currentSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!currentSession?.user) {
          throw new Error(
            "This invitation is invalid, expired, or has already been used.",
          );
        }

        if (!mounted) return;

        setSession(currentSession);

        const user = currentSession.user;

        setEmail(user.email || "");

        setFullName(
          user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            "",
        );
      } catch (err) {
        console.error("Invitation initialization failed:", err);

        if (mounted) {
          setError(
            err?.message ||
              "Unable to open this invitation. Please request a new invitation.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initializeInvite();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!session?.user) {
      setError(
        "Your invitation session is no longer available. Please open the invitation email again.",
      );
      return;
    }

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (password.length < 8) {
      setError("Your password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    try {
      setSaving(true);

      const { data, error: updateError } =
        await supabase.auth.updateUser({
          password,
          data: {
            full_name: fullName.trim(),
          },
        });

      if (updateError) {
        throw updateError;
      }

      if (!data?.user) {
        throw new Error(
          "Your account could not be completed. Please try again.",
        );
      }

      setSuccess(true);

      /*
       * Give the user a moment to see the success message,
       * then return to the normal Jwandoon login screen.
       */
      setTimeout(async () => {
        await supabase.auth.signOut();

        window.location.href = "/";
      }, 1800);
    } catch (err) {
      console.error("Password setup failed:", err);

      setError(
        err?.message ||
          "Unable to create your password. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="invite-page">
        <div className="invite-card">
          <div className="invite-brand">
            <div className="invite-logo">J</div>

            <div>
              <strong>JWANDOON</strong>
              <span>BUSINESS</span>
            </div>
          </div>

          <div className="invite-loading">
            <div className="invite-loader" />

            <h2>Opening your invitation...</h2>

            <p>Please wait while we securely verify your invitation.</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="invite-page">
        <div className="invite-card">
          <div className="invite-brand">
            <div className="invite-logo">J</div>

            <div>
              <strong>JWANDOON</strong>
              <span>BUSINESS</span>
            </div>
          </div>

          <div className="invite-success">
            <div className="invite-success-icon">
              <FiCheckCircle />
            </div>

            <span className="invite-eyebrow">
              ACCOUNT READY
            </span>

            <h1>Welcome to Jwandoon Business</h1>

            <p>
              Your account has been successfully created.
              Redirecting you to the secure login page...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="invite-page">
      <div className="invite-card">
        <div className="invite-brand">
          <div className="invite-logo">J</div>

          <div>
            <strong>JWANDOON</strong>
            <span>BUSINESS</span>
          </div>
        </div>

        <div className="invite-header">
          <span className="invite-eyebrow">
            BUSINESS ACCESS
          </span>

          <h1>Complete Your Account</h1>

          <p>
            You've been invited to join Jwandoon Business.
            Create your password to continue.
          </p>
        </div>

        <div className="invite-account">
          <div className="invite-account-icon">
            <FiMail />
          </div>

          <div>
            <span>Invited account</span>
            <strong>{email}</strong>
          </div>
        </div>

        <form
          className="invite-form"
          onSubmit={handleSubmit}
        >
          <label>
            Full name

            <div className="invite-input">
              <FiMail />

              <input
                type="text"
                value={fullName}
                onChange={(event) =>
                  setFullName(event.target.value)
                }
                placeholder="Your full name"
                autoComplete="name"
                disabled={saving}
                required
              />
            </div>
          </label>

          <label>
            Create password

            <div className="invite-input">
              <FiLock />

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
                disabled={saving}
                required
              />
            </div>
          </label>

          <label>
            Confirm password

            <div className="invite-input">
              <FiLock />

              <input
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                placeholder="Enter password again"
                autoComplete="new-password"
                disabled={saving}
                required
              />
            </div>
          </label>

          {error && (
            <div className="invite-message invite-message-error">
              <FiAlertCircle />

              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="invite-submit"
            disabled={saving}
          >
            <FiShield />

            {saving
              ? "Creating your account..."
              : "Create Account"}
          </button>
        </form>

        <div className="invite-security">
          <FiShield />

          <span>
            Your account is protected by Jwandoon Business
            authentication and email verification.
          </span>
        </div>
      </div>
    </div>
  );
}