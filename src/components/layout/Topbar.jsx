import { FiBell, FiSearch, FiUser } from "react-icons/fi";

export default function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar-search">
        <FiSearch />

        <input
          type="search"
          placeholder="Search products, invoices, sales..."
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
          <div className="user-avatar">
            <FiUser />
          </div>

          <div className="user-info">
            <strong>Admin</strong>
            <span>Owner</span>
          </div>
        </div>
      </div>
    </header>
  );
}