import { useState } from "react";

import { useAuth } from "../context/AuthContext";

import {
  FiUser,
  FiShield,
  FiBell,
  FiBriefcase,
  FiInfo,
  FiLock,
} from "react-icons/fi";

import "./Settings.css";

export default function Settings() {
  const { profile, updateUserPassword } = useAuth();

  const userName = profile?.full_name || "User";
  const userEmail = profile?.email || "No email available";
  const userRole = profile?.role || "STAFF";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  const [changingPassword, setChangingPassword] = useState(false);

  async function handleChangePassword(event) {
    event.preventDefault();

    setPasswordError("");
    setPasswordMessage("");

    if (newPassword.length < 8) {
      setPasswordError(
        "Password must be at least 8 characters long.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setChangingPassword(true);

    try {
      await updateUserPassword(newPassword);

      setNewPassword("");
      setConfirmPassword("");

      setPasswordMessage(
        "Your password has been changed successfully.",
      );
    } catch (error) {
      console.error(error);

      setPasswordError(
        error?.message ||
          "Unable to change your password.",
      );
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <section className="settings-page">
      <div className="settings-header">
        <div>
          <span className="settings-eyebrow">SYSTEM</span>

          <h1>Settings</h1>

          <p>
            Manage your account and JWANDOON Business
            preferences.
          </p>
        </div>
      </div>

      <div className="settings-grid">
        {/* MY ACCOUNT */}
        <section className="settings-card settings-profile-card">
          <div className="settings-card-header">
            <div className="settings-icon">
              <FiUser />
            </div>

            <div>
              <h2>My Account</h2>
              <p>Your current JWANDOON Business account.</p>
            </div>
          </div>

          <div className="settings-profile">
            <div className="settings-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>

            <div className="settings-profile-info">
              <strong>{userName}</strong>

              <span>{userEmail}</span>

              <div className="settings-role">
                <FiShield />
                {userRole}
              </div>
            </div>
          </div>
        </section>

        {/* BUSINESS */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon">
              <FiBriefcase />
            </div>

            <div>
              <h2>Business</h2>
              <p>JWANDOON Business information.</p>
            </div>
          </div>

          <div className="settings-list">
            <div className="settings-row">
              <span>Business name</span>
              <strong>JWANDOON</strong>
            </div>

            <div className="settings-row">
              <span>Application</span>
              <strong>Business Management</strong>
            </div>

            <div className="settings-row">
              <span>Access</span>
              <strong>Authorized personnel</strong>
            </div>
          </div>
        </section>

        {/* NOTIFICATIONS */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon">
              <FiBell />
            </div>

            <div>
              <h2>Notifications</h2>
              <p>Stay informed about business activity.</p>
            </div>
          </div>

          <div className="settings-status">
            <span className="settings-status-dot" />

            <div>
              <strong>Notifications enabled</strong>

              <p>
                You will receive relevant business
                notifications through the notification
                center.
              </p>
            </div>
          </div>
        </section>

        {/* SECURITY */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon">
              <FiShield />
            </div>

            <div>
              <h2>Security</h2>
              <p>Your account security information.</p>
            </div>
          </div>

          <div className="settings-security">
            <div className="settings-security-row">
              <span>Login verification</span>

              <span className="settings-badge">
                Enabled
              </span>
            </div>

            <div className="settings-security-row">
              <span>Account status</span>

              <span className="settings-badge">
                Active
              </span>
            </div>
          </div>

          {/* CHANGE PASSWORD */}
          <div className="settings-password-section">
            <div className="settings-password-heading">
              <FiLock />

              <div>
                <strong>Change password</strong>

                <span>
                  Update the password for your account.
                </span>
              </div>
            </div>

            <form
              className="settings-password-form"
              onSubmit={handleChangePassword}
            >
              <label>
                New password

                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) =>
                    setNewPassword(event.target.value)
                  }
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>

              <label>
                Confirm password

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
              </label>

              {passwordError && (
                <p className="settings-password-error">
                  {passwordError}
                </p>
              )}

              {passwordMessage && (
                <p className="settings-password-success">
                  {passwordMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={
                  changingPassword ||
                  !newPassword ||
                  !confirmPassword
                }
              >
                {changingPassword
                  ? "Updating..."
                  : "Change password"}
              </button>
            </form>
          </div>
        </section>

        {/* ABOUT */}
        <section className="settings-card settings-about-card">
          <div className="settings-card-header">
            <div className="settings-icon">
              <FiInfo />
            </div>

            <div>
              <h2>About JWANDOON Business</h2>
              <p>Application information.</p>
            </div>
          </div>

          <div className="settings-about">
            <div>
              <span>Application</span>

              <strong>
                JWANDOON Business Management
              </strong>
            </div>

            <div>
              <span>Version</span>

              <strong>1.0</strong>
            </div>

            <div>
              <span>Status</span>

              <strong className="settings-active">
                Active
              </strong>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}