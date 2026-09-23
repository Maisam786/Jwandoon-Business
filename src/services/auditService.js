import { supabase } from "./supabase";

export async function getAuditLogs(limit = 100) {
  const { data, error } = await supabase.rpc("get_audit_logs", {
    p_limit: limit,
  });

  if (error) {
    throw error;
  }

  return data ?? [];
}