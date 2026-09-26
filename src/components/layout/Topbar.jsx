import { FiBell, FiSearch, FiUser } from "react-icons/fi";

import { useAuth } from "../../context/AuthContext";

import "./Topbar.css";



export default function Topbar() {
  const { profile } = useAuth();

  const userName = profile?.full_name || "User";
  const userRole = profile?.role || "STAFF";

  return (
    <header className="topbar">
      <div className="topbar-search">
        <FiSearch />

        <input
          type="search"
          placeholder="Search products, invoices, sales..."
          aria-label="Search products, invoices, sales"
        />
      </div>

      <div className="topbar-actions">
        <button
          type="button"
          className="topbar-icon"
          aria-label="Notifications"
        >
          <FiBell />

          <span className="notification-dot" />
        </button>

        <div className="user-menu">
          <div className="user-avatar" aria-hidden="true">
            <FiUser />
          </div>

          <div className="user-info">
            <strong title={userName}>{userName}</strong>
            <span>{userRole}</span>
          </div>
        </div>
      </div>
    </header>
  );
}