import { useEffect, useState } from "react";
import {
  FiUsers,
  FiShield,
  FiUserPlus,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";

import { getUsers, createUser, manageUser } from "../services/userService";

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getRoleLabel(role) {
  switch (role) {
    case "OWNER":
      return "Owner";

    case "MANAGER":
      return "Manager";

    case "STAFF":
      return "Staff";

    default:
      return role || "Unknown";
  }
}

export default function Users() {
  const [managingUserId, setManagingUserId] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);

  const [newUser, setNewUser] = useState({
    fullName: "",
    email: "",
    role: "STAFF",
  });

  const [userMessage, setUserMessage] = useState("");
  const [userError, setUserError] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  function closeAddUserModal() {
    if (creatingUser) return;

    setShowAddUser(false);

    setNewUser({
      fullName: "",
      email: "",
      role: "STAFF",
    });

    setUserMessage("");
    setUserError("");
  }

  async function handleCreateUser(event) {
    event.preventDefault();

    setUserMessage("");
    setUserError("");

    if (!newUser.fullName.trim()) {
      setUserError("Full name is required.");
      return;
    }

    if (!newUser.email.trim()) {
      setUserError("Email is required.");
      return;
    }

    try {
      setCreatingUser(true);

      await createUser({
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
      });

      setUserMessage(
        "User created successfully. An invitation has been sent to their email.",
      );

      setNewUser({
        fullName: "",
        email: "",
        role: "STAFF",
      });

      await loadUsers(true);
    } catch (error) {
      console.error("Failed to create user:", error);

      setUserError(
        error?.message || "Unable to create the user. Please try again.",
      );
    } finally {
      setCreatingUser(false);
    }
  }

  async function handleManageUser(user, action, role = null) {
    const actionText =
      action === "DEACTIVATE"
        ? "deactivate"
        : action === "ACTIVATE"
          ? "activate"
          : `change the role to ${role}`;

    const confirmed = window.confirm(
      `Are you sure you want to ${actionText} ${user.full_name}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setManagingUserId(user.id);
      setUserError("");
      setUserMessage("");

      await manageUser({
        userId: user.id,
        action,
        role,
      });

      setUserMessage(`${user.full_name} was updated successfully.`);

      await loadUsers();
    } catch (error) {
      setUserError(error?.message || "Unable to update this user.");
    } finally {
      setManagingUserId(null);
    }
  }

  async function loadUsers(showRefresh = false) {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getUsers();

      setUsers(data);
    } catch (err) {
      console.error("Failed to load users:", err);

      setError(err?.message || "Unable to load users. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const activeUsers = users.filter((user) => user.active).length;

  const inactiveUsers = users.filter((user) => !user.active).length;

  const ownerCount = users.filter((user) => user.role === "OWNER").length;

  const managerCount = users.filter((user) => user.role === "MANAGER").length;

  const staffCount = users.filter((user) => user.role === "STAFF").length;

  if (loading) {
    return (
      <div className="users-page">
        <div className="dashboard-loading">
          <div className="dashboard-loader" />
          <p>Loading authorized users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <span className="page-eyebrow">ACCESS MANAGEMENT</span>

          <h1>Users</h1>

          <p>Manage authorized Jwandoon Business personnel and their access.</p>
        </div>

        <div className="dashboard-header-actions">
          <button
            type="button"
            className="dashboard-refresh"
            onClick={() => loadUsers(true)}
            disabled={refreshing}
          >
            <FiRefreshCw className={refreshing ? "dashboard-spin" : ""} />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            className="panel-action"
            onClick={() => {
              setUserError("");
              setUserMessage("");
              setShowAddUser(true);
            }}
          >
            <FiUserPlus />
            Add User
          </button>
        </div>
      </div>

      {error && (
        <div className="dashboard-error">
          <FiAlertCircle />

          <div>
            <strong>Users update failed</strong>
            <span>{error}</span>
          </div>

          <button type="button" onClick={() => loadUsers(true)}>
            Try again
          </button>
        </div>
      )}

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <FiUsers />
          </div>

          <div>
            <span>Total Users</span>
            <strong>{users.length}</strong>
            <small>Authorized personnel</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FiCheckCircle />
          </div>

          <div>
            <span>Active Users</span>
            <strong>{activeUsers}</strong>
            <small>Currently authorized</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FiShield />
          </div>

          <div>
            <span>Managers</span>
            <strong>{managerCount}</strong>
            <small>Management access</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FiUsers />
          </div>

          <div>
            <span>Staff</span>
            <strong>{staffCount}</strong>
            <small>Staff access</small>
          </div>
        </div>
      </section>

      <section className="dashboard-panel">
        <div className="panel-header">
          <div>
            <span className="panel-eyebrow">USER MANAGEMENT</span>

            <h2>Authorized Users</h2>
          </div>

          <span>
            {ownerCount} owner · {managerCount} manager
            {managerCount === 1 ? "" : "s"} · {staffCount} staff
          </span>
        </div>

        {users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FiUsers />
            </div>

            <h3>No users found</h3>

            <p>No authorized profiles are currently available.</p>
          </div>
        ) : (
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      {user.role === "OWNER" ? (
                        <span className="user-protected">Protected</span>
                      ) : (
                        <div className="user-actions">
                          <button
                            type="button"
                            className="user-action-button"
                            disabled={managingUserId === user.id}
                            onClick={() =>
                              handleManageUser(
                                user,
                                user.active ? "DEACTIVATE" : "ACTIVATE",
                              )
                            }
                          >
                            {managingUserId === user.id
                              ? "Updating..."
                              : user.active
                                ? "Deactivate"
                                : "Activate"}
                          </button>

                          <button
                            type="button"
                            className="user-action-button"
                            disabled={managingUserId === user.id}
                            onClick={() =>
                              handleManageUser(
                                user,
                                "CHANGE_ROLE",
                                user.role === "MANAGER" ? "STAFF" : "MANAGER",
                              )
                            }
                          >
                            Change to{" "}
                            {user.role === "MANAGER" ? "Staff" : "Manager"}
                          </button>
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">
                          {user.full_name?.charAt(0)?.toUpperCase() || "U"}
                        </div>

                        <div>
                          <strong>{user.full_name || "Unnamed User"}</strong>

                          <span>{user.email || "No email"}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`user-role user-role-${String(
                          user.role || "",
                        ).toLowerCase()}`}
                      >
                        <FiShield />
                        {getRoleLabel(user.role)}
                      </span>
                    </td>

                    <td>
                      {user.active ? (
                        <span className="user-status user-status-active">
                          <FiCheckCircle />
                          Active
                        </span>
                      ) : (
                        <span className="user-status user-status-inactive">
                          <FiXCircle />
                          Inactive
                        </span>
                      )}
                    </td>

                    <td>{formatDate(user.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {inactiveUsers > 0 && (
        <div className="dashboard-footer-note">
          <FiAlertCircle />

          <span>
            {inactiveUsers} inactive user
            {inactiveUsers === 1 ? "" : "s"} currently exists in the system.
          </span>
        </div>
      )}

      {showAddUser && (
        <div
          className="user-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAddUserModal();
            }
          }}
        >
          <div className="user-modal">
            <div className="user-modal-header">
              <div>
                <span className="panel-eyebrow">ACCESS MANAGEMENT</span>

                <h2>Add User</h2>

                <p>Create an authorized Jwandoon Business account.</p>
              </div>

              <button
                type="button"
                className="user-modal-close"
                onClick={closeAddUserModal}
                disabled={creatingUser}
                aria-label="Close"
              >
                <FiXCircle />
              </button>
            </div>

            <form className="user-modal-form" onSubmit={handleCreateUser}>
              <label>
                Full name
                <input
                  type="text"
                  value={newUser.fullName}
                  onChange={(event) =>
                    setNewUser((current) => ({
                      ...current,
                      fullName: event.target.value,
                    }))
                  }
                  placeholder="Enter full name"
                  autoComplete="name"
                  disabled={creatingUser}
                  required
                />
              </label>

              <label>
                Email address
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(event) =>
                    setNewUser((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  placeholder="Enter email address"
                  autoComplete="email"
                  disabled={creatingUser}
                  required
                />
              </label>

              <label>
                Role
                <select
                  value={newUser.role}
                  onChange={(event) =>
                    setNewUser((current) => ({
                      ...current,
                      role: event.target.value,
                    }))
                  }
                  disabled={creatingUser}
                >
                  <option value="STAFF">Staff</option>
                  <option value="MANAGER">Manager</option>
                </select>
              </label>

              {userError && (
                <div className="user-form-message user-form-error">
                  <FiAlertCircle />
                  <span>{userError}</span>
                </div>
              )}

              {userMessage && (
                <div className="user-form-message user-form-success">
                  <FiCheckCircle />
                  <span>{userMessage}</span>
                </div>
              )}

              <div className="user-modal-footer">
                <button
                  type="button"
                  className="user-modal-cancel"
                  onClick={closeAddUserModal}
                  disabled={creatingUser}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="user-modal-submit"
                  disabled={creatingUser}
                >
                  <FiUserPlus />

                  {creatingUser ? "Creating..." : "Create & Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
