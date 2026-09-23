import {
  FiGrid,
  FiShoppingBag,
  FiPackage,
  FiBox,
  FiBarChart2,
  FiUsers,
  FiSettings,
  FiLogOut,
  FiClipboard,
} from "react-icons/fi";

import { useAuth } from "../../context/AuthContext";

const navigation = [
  {
    label: "Overview",
    icon: FiGrid,
    path: "dashboard",
    allowedRoles: ["OWNER", "MANAGER", "STAFF"],
  },
  {
    label: "Billing",
    icon: FiShoppingBag,
    path: "billing",
    allowedRoles: ["OWNER", "MANAGER", "STAFF"],
  },
  {
    label: "Inventory",
    icon: FiPackage,
    path: "inventory",
    allowedRoles: ["OWNER", "MANAGER", "STAFF"],
  },
  {
    label: "Products",
    icon: FiBox,
    path: "products",
    allowedRoles: ["OWNER", "MANAGER", "STAFF"],
  },
  {
    label: "Sales",
    icon: FiShoppingBag,
    path: "sales",
    allowedRoles: ["OWNER", "MANAGER", "STAFF"],
  },
  {
    label: "Reports",
    icon: FiBarChart2,
    path: "reports",
    allowedRoles: ["OWNER", "MANAGER"],
  },
];

export default function Sidebar({ activePage, onNavigate }) {
  const { profile, signOut } = useAuth();

  const userRole = profile?.role;

  async function handleSignOut() {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  }

  const visibleNavigation = navigation.filter((item) =>
    item.allowedRoles.includes(userRole),
  );

  const canManageUsers = userRole === "OWNER";
  const canViewAuditLogs = userRole === "OWNER";

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">J</div>

        <div>
          <strong>JWANDOON</strong>
          <span>BUSINESS</span>
        </div>
      </div>

      <div className="sidebar-section">
        <span className="sidebar-label">MAIN MENU</span>

        <nav className="sidebar-nav">
          {visibleNavigation.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.path;

            return (
              <button
                key={item.path}
                type="button"
                className={`sidebar-link ${active ? "active" : ""}`}
                onClick={() => onNavigate(item.path)}
              >
                <Icon />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-bottom">
        <span className="sidebar-label">SYSTEM</span>

        {canManageUsers && (
          <button
            type="button"
            className={`sidebar-link ${activePage === "users" ? "active" : ""}`}
            onClick={() => onNavigate("users")}
          >
            <FiUsers />
            <span>Users</span>
          </button>
        )}

        {canViewAuditLogs && (
          <button
            type="button"
            className={`sidebar-link ${
              activePage === "auditLogs" ? "active" : ""
            }`}
            onClick={() => onNavigate("auditLogs")}
          >
            <FiClipboard />
            <span>Audit Activity</span>
          </button>
        )}

        <button
          type="button"
          className={`sidebar-link ${
            activePage === "settings" ? "active" : ""
          }`}
          onClick={() => onNavigate("settings")}
        >
          <FiSettings />
          <span>Settings</span>
        </button>

        <button
          type="button"
          className="sidebar-link logout-link"
          onClick={handleSignOut}
        >
          <FiLogOut />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
