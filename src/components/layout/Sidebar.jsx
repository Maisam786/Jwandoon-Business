import {
  FiGrid,
  FiShoppingBag,
  FiPackage,
  FiBox,
  FiBarChart2,
  FiUsers,
  FiSettings,
  FiLogOut,
} from "react-icons/fi";

import { useAuth } from "../../context/AuthContext";

const navigation = [
  {
    label: "Overview",
    icon: FiGrid,
    path: "dashboard",
  },
  {
    label: "Billing",
    icon: FiShoppingBag,
    path: "billing",
  },
  {
    label: "Inventory",
    icon: FiPackage,
    path: "inventory",
  },
  {
    label: "Products",
    icon: FiBox,
    path: "products",
  },
  {
    label: "Sales",
    icon: FiShoppingBag,
    path: "sales",
  },
  {
    label: "Reports",
    icon: FiBarChart2,
    path: "reports",
  },
];

export default function Sidebar({ activePage, onNavigate }) {
  const { signOut } = useAuth();

  async function handleSignOut() {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  }

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
          {navigation.map((item) => {
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

        <button
          type="button"
          className="sidebar-link"
          onClick={() => onNavigate("users")}
        >
          <FiUsers />
          <span>Users</span>
        </button>

        <button
          type="button"
          className="sidebar-link"
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