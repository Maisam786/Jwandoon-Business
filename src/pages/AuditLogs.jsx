import { useCallback, useEffect, useState } from "react";

import { getAuditLogs } from "../services/auditService";
import { useAuth } from "../context/AuthContext";

export default function AuditLogs() {
  const { profile } = useAuth();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAuditLogs(100);
      setLogs(data);
    } catch (err) {
      setError(err?.message || "Unable to load audit logs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profile?.role === "OWNER") {
      loadLogs();
    }
  }, [profile?.role, loadLogs]);

  if (profile?.role !== "OWNER") {
    return (
      <section>
        <h1>Access denied</h1>
        <p>You do not have permission to view audit logs.</p>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <h1>Audit Activity</h1>
          <p>
            A record of important actions performed in JWANDOON.
          </p>
        </div>

        <button
          type="button"
          onClick={loadLogs}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {!loading && !error && logs.length === 0 && (
        <div className="empty-state">
          No audit activity has been recorded yet.
        </div>
      )}

      {!loading && logs.length > 0 && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Entity</th>
                <th>Details</th>
                <th>Date & Time</th>
              </tr>
            </thead>

            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.action}</td>

                  <td>
                    {log.entity_type || "—"}
                    {log.entity_id
                      ? ` #${log.entity_id}`
                      : ""}
                  </td>

                  <td>
                    <pre
                      style={{
                        margin: 0,
                        whiteSpace: "pre-wrap",
                        fontFamily: "inherit",
                      }}
                    >
                      {JSON.stringify(
                        log.details ?? {},
                        null,
                        2,
                      )}
                    </pre>
                  </td>

                  <td>
                    {new Date(
                      log.created_at,
                    ).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}