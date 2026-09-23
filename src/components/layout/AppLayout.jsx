import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout({
  activePage,
  onNavigate,
  children,
}) {
  return (
    <div className="business-layout">
      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
      />

      <div className="business-main">
        <Topbar />

        <main className="business-content">
          {children}
        </main>
      </div>
    </div>
  );
}